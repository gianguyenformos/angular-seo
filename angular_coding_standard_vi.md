# Tiêu chuẩn mã nguồn Angular (Angular 21.x)

**Phạm vi:** Ứng dụng frontend sử dụng **Angular 21.x**

**Backend:** REST / JSON (Spring Boot hoặc tương đương)

---

## 1. Cấu trúc dự án

**Quy tắc (Chuẩn mực):** Các nhóm **BẮT BUỘC** sử dụng kiến trúc phân lớp theo tính năng (feature-first). Mỗi tính năng sở hữu UI, state và truy cập dữ liệu của riêng nó.

### ❌ SAI — Cấu trúc theo loại

```
components/
services/
models/
```

#### Vì sao SAI

- Không có quyền sở hữu rõ ràng theo tính năng
- Liên kết chặt giữa các tính năng không liên quan
- Khó xóa, tái cấu trúc hoặc mở rộng từng tính năng độc lập

### ✅ ĐÚNG — Cấu trúc theo tính năng

```
users/
  pages/
  ui/
  data-access/
  users.routes.ts
```

#### Lợi ích của cách ĐÚNG

- Quyền sở hữu rõ ràng theo từng tính năng
- Cho phép lazy loading và tái cấu trúc độc lập
- Mở rộng tốt cho đội ngũ lớn

---

## 2. Quản lý trạng thái (Chỉ dùng Angular Signals)

**Quy tắc (Chuẩn mực):** Ứng dụng Angular **BẮT BUỘC dùng Angular Signals** (`signal`, `computed`, `effect`) cho quản lý trạng thái.

---

### 2.1 Trạng thái component

**Quy tắc (Chuẩn mực):** Component **CHỈ** quản lý trạng thái cục bộ, chỉ phục vụ hiển thị (bật/tắt UI, lựa chọn).

### ❌ SAI — Component nắm trạng thái nghiệp vụ

```ts
users = signal<User[]>([]);
ngOnInit() {
  this.api.getUsers().subscribe(u => this.users.set(u));
}
```

#### Vì sao SAI

- Component trộn lẫn UI và dữ liệu
- Side-effect bất đồng bộ ẩn trong tầng UI
- Trạng thái bị hủy khi component bị teardown

### ✅ ĐÚNG — Component đọc từ Signals Store

```ts
users = this.usersStore.users;
```

#### Lợi ích của cách ĐÚNG

- Component không giữ state
- Tách biệt rõ trách nhiệm
- Render dễ dự đoán

---

### 2.2 Signals Store (Trạng thái do Service sở hữu)

**Quy tắc (Chuẩn mực):** Trạng thái ứng dụng và dùng chung **BẮT BUỘC** nằm trong service có thể inject, dùng Signals.

### ❌ SAI — Trạng thái dùng chung có thể thay đổi

```ts
@Injectable()
export class UserService {
  users: User[] = [];
}
```

#### Vì sao SAI

- Trạng thái có thể thay đổi
- Không theo dõi thay đổi
- Khó kiểm thử

### ✅ ĐÚNG — Store Service dựa trên Signals

```ts
@Injectable({ providedIn: 'root' })
export class UsersStore {
  private readonly _users = signal<User[]>([]);
  private readonly _loading = signal(false);

  readonly users = computed(() => this._users());
  readonly loading = computed(() => this._loading());

  loadUsers(users: User[]): void {
    this._users.set(users);
  }
}
```

#### Lợi ích của cách ĐÚNG

- Một nguồn sự thật duy nhất
- Phản ứng theo kiểu Angular gốc
- Dễ unit test

---

### 2.3 Trạng thái dẫn xuất với `computed`

**Quy tắc (Chuẩn mực):** Trạng thái dẫn xuất **BẮT BUỘC** khai báo bằng `computed()` trong store.

### ❌ SAI — Tính toán trong component

```ts
activeUsers = this.usersStore.users().filter(u => u.active);
```

#### Vì sao SAI

- Trùng lặp logic
- Tính lại mỗi lần render

### ✅ ĐÚNG — Trạng thái dẫn xuất tập trung

```ts
readonly activeUsers = computed(() =>
  this._users().filter(u => u.active)
);
```

#### Lợi ích của cách ĐÚNG

- Được ghi nhớ (memoized)
- Logic nghiệp vụ tập trung

---

### 2.4 Cô lập side-effect (BẮT BUỘC)

**Mục tiêu**  
Cô lập chặt chẽ mọi side-effect (HTTP, timer, API trình duyệt, logging) khỏi logic trạng thái để đảm bảo **trạng thái dự đoán được, dễ kiểm thử và an toàn SSR**.

---

### Trách nhiệm từng tầng (BẮT BUỘC)

| Tầng   | File               | Trách nhiệm                                           | Được dùng HttpClient | Sở hữu Signals |
| ------ | ------------------ | ----------------------------------------------------- | -------------------- | -------------- |
| API    | `users.api.ts`     | Chỉ gọi HTTP mức thấp                                 | ✅ CÓ                | ❌ KHÔNG       |
| Store  | `users.store.ts`   | Trạng thái + computed + mutation đồng bộ thuần túy    | ❌ KHÔNG             | ✅ CÓ          |
| Facade | `users.facade.ts`  | Điều phối side-effect và cập nhật trạng thái           | ✅ CÓ                | ❌ KHÔNG       |

---

**Định nghĩa Side-effect**

- Gọi HTTP / WebSocket / EventSource
- `setTimeout`, `setInterval`
- `localStorage`, `sessionStorage`, `window`, `document`
- Điều hướng Router
- Logging / analytics

---

### 🚫 CẤM TUYỆT ĐỐI

- Store **KHÔNG ĐƯỢC**:
  - Gọi API HTTP
  - Inject `HttpClient`
  - Truy cập API chỉ có trên trình duyệt
  - Chứa `subscribe()`

- API **KHÔNG ĐƯỢC**:
  - Giữ trạng thái (Signals, Subjects)
  - Chứa logic nghiệp vụ

- Facade **KHÔNG ĐƯỢC**:
  - Khai báo Signals
  - Expose trạng thái có thể thay đổi

---

### ❌ SAI — Trách nhiệm gộp chung

```ts
// users.service.ts ❌ mọi thứ trộn lẫn
@Injectable()
export class UsersService {
  users = signal<User[]>([]);

  load() {
    this.http.get<User[]>('/api/users').subscribe(u => this.users.set(u));
  }
}
```

**Vì sao SAI**

- Không có ranh giới rõ
- Không thể test tách biệt
- Không an toàn SSR

---

### ✅ ĐÚNG — Tách biệt rõ ràng

```ts
// users.api.ts
@Injectable({ providedIn: 'root' })
export class UsersApi {
  load(): Observable<User[]> {
    return this.http.get<User[]>('/api/users');
  }
}
```

```ts
// users.store.ts
@Injectable({ providedIn: 'root' })
export class UsersStore {
  private readonly _users = signal<User[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly users = computed(() => this._users());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  setUsers(users: User[]): void {
    this._users.set(users);
  }

  setLoading(value: boolean): void {
    this._loading.set(value);
  }

  setError(message: string | null): void {
    this._error.set(message);
  }
}
```

```ts
// users.facade.ts
@Injectable({ providedIn: 'root' })
export class UsersFacade {
  readonly users = this.store.users;
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  load(): void {
    this.store.setLoading(true);
    this.store.setError(null);

    this.api.load().subscribe({
      next: users => this.store.setUsers(users),
      error: err => this.store.setError(err.message),
      complete: () => this.store.setLoading(false)
    });
  }
}
```

---

**Lợi ích của cách ĐÚNG**

- Một trách nhiệm mỗi file
- Store thuần túy và đồng bộ
- Facade kiểm soát toàn bộ side-effect
- Tầng API dễ mock
- An toàn SSR và mở rộng cho doanh nghiệp

---

**Quy tắc (Chuẩn mực):** Side-effect **BẮT BUỘC** được cô lập: dùng **phương thức Facade** cho async mệnh lệnh (load, save, submit); dùng `effect()` chỉ cho side-effect phản ứng (ví dụ logging, analytics khi trạng thái đổi), và **chỉ trong Facade hoặc component**, không bao giờ trong Store.

### ❌ SAI — Side-effect trong component

```ts
save() {
  this.http.post('/api/users', this.user).subscribe();
}
```

#### Vì sao SAI

- Không kiểm thử được
- Hành vi async ẩn

### ✅ ĐÚNG — Side-effect trong Facade (mệnh lệnh) hoặc effect (phản ứng)

```ts
// Facade: async mệnh lệnh (mẫu chính)
load(): void {
  this.api.load().subscribe(users => this.store.setUsers(users));
}

// Component/Facade: side-effect phản ứng chỉ khi cần (ví dụ logging)
effect(() => {
  if (this.store.loading()) console.log('Loading users');
});
```

#### Lợi ích của cách ĐÚNG

- Nhận biết vòng đời
- Kiểm thử được
- Dự đoán được

---

### 2.5 Quy ước thư mục Signals Store (BẮT BUỘC)

**Quy tắc (Chuẩn mực):** Mỗi tính năng **BẮT BUỘC** expose đúng một Signals Store trong tầng `data-access`.

### ❌ SAI — Store trộn với UI

```
users/
  users.component.ts
  users.store.ts
```

#### Vì sao SAI

- Làm mờ trách nhiệm UI vs state
- Khó ép ranh giới

### ✅ ĐÚNG — Tầng data-access rõ ràng

```
users/
  pages/
  ui/
  data-access/
    users.store.ts
    users.api.ts
    users.facade.ts
```

#### Lợi ích của cách ĐÚNG

- Quyền sở hữu trạng thái rõ
- Ranh giới có thể ép
- Mở rộng cho nhiều team

---

### 2.6 Mẫu Async & HTTP (Signals + RxJS)

**Quy tắc (Chuẩn mực):** RxJS **CHỈ** dùng cho I/O. **Mọi subscription và luồng async BẮT BUỘC nằm ở tầng Facade.** Store **BẮT BUỘC đồng bộ và không có side-effect**.

---

### ❌ SAI — Logic async trong component

```ts
ngOnInit() {
  this.http.get<User[]>('/api/users').subscribe(u => this.users.set(u));
}
```

**Vì sao SAI**

- Logic async ẩn trong UI
- Không tái sử dụng được
- Khó kiểm thử

---

### ❌ SAI — Logic async trong Store

```ts
@Injectable({ providedIn: 'root' })
export class UsersStore {
  private readonly _users = signal<User[]>([]);

  load(): void {
    this.api.load().subscribe(users => this._users.set(users));
  }
}
```

**Vì sao SAI**

- Store sở hữu side-effect
- Vi phạm quy tắc cô lập (2.4)
- Không an toàn SSR

---

### ✅ ĐÚNG — Async trong Facade, state trong Store

```ts
@Injectable({ providedIn: 'root' })
export class UsersFacade {
  readonly users = this.store.users;

  load(): void {
    this.api.load().subscribe(users => this.store.setUsers(users));
  }
}
```

```ts
@Injectable({ providedIn: 'root' })
export class UsersStore {
  private readonly _users = signal<User[]>([]);
  readonly users = computed(() => this._users());

  setUsers(users: User[]): void {
    this._users.set(users);
  }
}
```

**Lợi ích của cách ĐÚNG**

- Một ranh giới async
- Store thuần túy và đồng bộ
- Khớp với Cô lập Side-effect (2.4)
- An toàn SSR và kiểm thử được

---

### 2.7 Mẫu trạng thái Lỗi & Loading (BẮT BUỘC)

**Quy tắc (Chuẩn mực):** Trạng thái loading và lỗi **BẮT BUỘC** lưu dưới dạng Signals rõ ràng trong Store và **CHỈ được thay đổi bởi Facade**.

---

### ❌ SAI — Trạng thái async ngầm định

```ts
this.http.get('/api/users').subscribe(users => this._users.set(users));
```

**Vì sao SAI**

- Không có signal loading
- Không xử lý lỗi
- UI không phản ứng xác định được

---

### ❌ SAI — Store thay đổi loading trong công việc async

```ts
load(): void {
  this._loading.set(true);
  this.api.load().subscribe(() => this._loading.set(false));
}
```

**Vì sao SAI**

- Store sở hữu vòng đời async
- Vi phạm trách nhiệm Facade

---

### ✅ ĐÚNG — Facade điều khiển vòng đời, Store giữ state

```ts
@Injectable({ providedIn: 'root' })
export class UsersFacade {
  load(): void {
    this.store.setLoading(true);
    this.store.setError(null);

    this.api.load().subscribe({
      next: users => this.store.setUsers(users),
      error: err => this.store.setError(err.message),
      complete: () => this.store.setLoading(false)
    });
  }
}
```

```ts
@Injectable({ providedIn: 'root' })
export class UsersStore {
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  setLoading(value: boolean): void {
    this._loading.set(value);
  }

  setError(message: string | null): void {
    this._error.set(message);
  }
}
```

**Lợi ích của cách ĐÚNG**

- Trạng thái UI xác định
- Quyền sở hữu rõ vòng đời async
- Nhất quán với Mục 2.4 và 2.6
- Dễ kiểm thử và lý luận

---

### 2.8 Chiến lược kiểm thử cho Signals Store (BẮT BUỘC)

**Quy tắc (Chuẩn mực):** Signals Store **BẮT BUỘC** được unit test trực tiếp không dùng TestBed.

❌ SAI — Kiểm thử qua component

```ts
render(UsersComponent);
```

**Vì sao SAI**

- Chậm
- Test UI thay vì hành vi

✅ ĐÚNG — Kiểm thử store trực tiếp

```ts
it('cập nhật users khi setUsers được gọi', () => {
  const store = new UsersStore();
  store.setUsers([{ id: 1, name: 'Alice' }]);
  expect(store.users()).toHaveLength(1);
});
```

**Lợi ích của cách ĐÚNG**

- Test nhanh
- Assert xác định
- Không phụ thuộc TestBed của Angular

---

### 2.9 Quy tắc SSR + Signals (Angular 21.x) (BẮT BUỘC)

**Mục tiêu**  
Đảm bảo Signals hoạt động **an toàn và dự đoán được trong SSR và hydration**, tránh lệch DOM và lỗi phụ thuộc môi trường.

---

#### 🚫 CẤM TUYỆT ĐỐI

- `effect()` **KHÔNG ĐƯỢC**:
  - Gọi API HTTP trong SSR
  - Truy cập `window`, `document`, `localStorage`
  - Thực hiện mutation trạng thái bất đồng bộ trong SSR

- Store **KHÔNG ĐƯỢC**:
  - Tải dữ liệu bất đồng bộ
  - Phụ thuộc điều kiện môi trường runtime

---

#### ✅ QUY TẮC BẮT BUỘC

- Tải dữ liệu **CHỈ ĐƯỢC** chạy khi:
  - `isPlatformBrowser()` === `true`

- Trong khi thực thi SSR:
  - **Không** mutate state từ callback async hoặc `effect()` (sẽ chạy trên Node và gây không xác định).
  - Trạng thái ban đầu từ Route `resolve()` hoặc `TransferState` (thiết lập trong SSR) **được phép**; tiêu thụ sau khi hydration.

---

#### SAI (Ví dụ lỗi Hydration)

```ts
// ❌ effect chạy trong SSR
constructor() {
  effect(() => {
    this.http.get('/api/data').subscribe(...);
  });
}
```

---

#### ĐÚNG (Mẫu an toàn SSR)

```ts
constructor(
  private readonly platformId: Object,
  private readonly facade: UsersFacade
) {
  if (isPlatformBrowser(this.platformId)) {
    effect(() => {
      this.facade.loadData();
    });
  }
}
```

---

#### ⭐ KHUYẾN NGHỊ DOANH NGHIỆP

- Fetch dữ liệu SSR **NÊN** thực hiện qua:
  - Angular Route `resolve()`
  - `TransferState`

- Signals **CHỈ ĐƯỢC** tiêu thụ dữ liệu đã được hydrate

- Signals **KHÔNG ĐƯỢC** khởi tạo fetch dữ liệu phía SSR

---

❌ SAI — Công việc async trong signal

```ts
users = signal(this.http.get('/api/users'));
```

**Vì sao SAI**

- Phá tính xác định SSR
- Gây lệch hydration

✅ ĐÚNG — Mẫu an toàn SSR

```ts
loadOnClient(): void {
  if (isPlatformBrowser(this.platformId)) {
    this.load();
  }
}
```

**Lợi ích của cách ĐÚNG**

- SSR dự đoán được
- Hydration an toàn
- Khớp mô hình SSR Angular 21

---

## 3. Components

### 3.1 Change Detection

**Quy tắc (Chuẩn mực):** Component **BẮT BUỘC** dùng `ChangeDetectionStrategy.OnPush` mặc định.

### ❌ SAI

```ts
@Component({})
```

#### Vì sao SAI

- Chu kỳ change detection không cần thiết
- Giảm hiệu năng

### ✅ ĐÚNG

```ts
@Component({ changeDetection: ChangeDetectionStrategy.OnPush })
```

#### Lợi ích của cách ĐÚNG

- Hiệu năng tốt hơn
- Luồng dữ liệu rõ ràng

---

### 3.2 Inputs & Outputs

**Quy tắc (Chuẩn mực):** Component **NÊN** "dumb" mặc định và **KHÔNG ĐƯỢC** chứa logic nghiệp vụ.

### ❌ SAI

```ts
@Input() user!: User;
this.api.save(user);
```

#### Vì sao SAI

- Component thực hiện logic nghiệp vụ
- Khó tái sử dụng

### ✅ ĐÚNG

```ts
@Output() save = new EventEmitter<User>();
```

#### Lợi ích của cách ĐÚNG

- Trách nhiệm rõ
- Dễ kiểm thử

---

## 4. Templates

### 4.1 Dữ liệu trong template (Signals vs Observable)

**Quy tắc (Chuẩn mực):** Ưu tiên **Signals** cho dữ liệu template: component expose `readonly users = this.facade.users` và template dùng `users()`. Chỉ dùng **async pipe** khi nguồn dữ liệu là Observable (một subscription, không logic trong template).

### ❌ SAI

```html
{{ users | async | json }}
```

#### Vì sao SAI

- Nhiều subscription
- Logic template không rõ

### ✅ ĐÚNG — Với Signals (ưu tiên)

```html
@for (u of users(); track u.id) { {{ u.name }} }
```

### ✅ ĐÚNG — Với Observable (khi không dùng Signals cho stream này)

```html
<ng-container *ngIf="users$ | async as users">
  <!-- dùng users -->
</ng-container>
```

#### Lợi ích của cách ĐÚNG

- Một subscription khi dùng Observables
- Template dễ đọc
- Với Signals: không cần async pipe; đọc signal trong template (ví dụ `users()`)

---

## 5. Hiệu năng

### 5.1 trackBy

**Quy tắc (Chuẩn mực):** Mọi `*ngFor` (hoặc `@for`) **BẮT BUỘC** dùng hàm `trackBy` (hoặc biểu thức `track`) theo định danh ổn định (ví dụ `id`).

### ❌ SAI

```html
<li *ngFor="let u of users">{{ u.name }}</li>
```

#### Vì sao SAI

- Re-render toàn bộ DOM khi thay đổi

### ✅ ĐÚNG

```html
<li *ngFor="let u of users(); trackBy: trackById">{{ u.name }}</li>
```

```ts
// Trong component (khi dùng hàm trackBy)
readonly trackById = (index: number, item: { id: number }) => item.id;
```

Với control flow Angular 17+: `@for (u of users(); track u.id) { ... }`

#### Lợi ích của cách ĐÚNG

- Cập nhật DOM hiệu quả

---

## 6. Bảo mật

### ❌ SAI

```html
<div [innerHTML]="html"></div>
```

#### Vì sao SAI

- Lỗ hổng XSS

### ✅ ĐÚNG

```html
<div>{{ text }}</div>
```

#### Lợi ích của cách ĐÚNG

- An toàn mặc định

---

## 7. Kiểm thử

### ❌ SAI

```ts
test('component lưu', () => {});
```

#### Vì sao SAI

- Test UI thay vì hành vi

### ✅ ĐÚNG

```ts
test('facade gửi action lưu', () => {});
```

#### Lợi ích của cách ĐÚNG

- Test ổn định, nhanh

---

## 8. Khả năng truy cập (Accessibility)

### ❌ SAI

```html
<div (click)="save()">Lưu</div>
```

#### Vì sao SAI

- Không truy cập được bằng bàn phím

### ✅ ĐÚNG

```html
<button (click)="save()">Lưu</button>
```

#### Lợi ích của cách ĐÚNG

- Truy cập được mặc định

---

## 9. i18n

### ❌ SAI

```html
<h1>Xin chào</h1>
```

#### Vì sao SAI

- Chuỗi cứng

### ✅ ĐÚNG

```html
<h1>{{ 'HELLO' | translate }}</h1>
```

#### Lợi ích của cách ĐÚNG

- Dễ bản địa hóa

---

## 10. Linting & Định dạng

### ❌ SAI

```ts
if(x==y){do();}
```

#### Vì sao SAI

- Phong cách không nhất quán

### ✅ ĐÚNG

```ts
if (x === y) {
  do();
}
```

#### Lợi ích của cách ĐÚNG

- Dễ đọc và có thể ép tuân thủ

---

## 11. CI/CD

### ❌ SAI

- Chỉ review thủ công

#### Vì sao SAI

- Áp dụng không nhất quán

### ✅ ĐÚNG

- ESLint + Prettier + Tests trong pipeline

#### Lợi ích của cách ĐÚNG

- Cổng chất lượng tự động

---

## 12. Tài liệu

### ❌ SAI

```ts
// TODO
```

#### Vì sao SAI

- Không ghi lại ý định

### ✅ ĐÚNG

```ts
/** Tải users từ API */
```

#### Lợi ích của cách ĐÚNG

- Dễ onboard

---

## 13. Quản lý phụ thuộc

### ❌ SAI

- Nâng cấp phiên bản ngẫu nhiên

#### Vì sao SAI

- Rủi ro breaking change

### ✅ ĐÚNG

- Nâng cấp minor Angular 21.x theo lịch

#### Lợi ích của cách ĐÚNG

- Bảo trì dự đoán được

---

## 14. Chiến lược nâng cấp

### ❌ SAI

- Bỏ qua phiên bản major

#### Vì sao SAI

- Nợ kỹ thuật tích tụ

### ✅ ĐÚNG

- Làm theo hướng dẫn cập nhật Angular theo từng bản phát hành

#### Lợi ích của cách ĐÚNG

- Nâng cấp an toàn, từng bước

---

## 15. Quản trị kiến trúc

### ❌ SAI

- Mỗi team tự quyết định mẫu

#### Vì sao SAI

- Kiến trúc không nhất quán

### ✅ ĐÚNG

- Ban kiến trúc trung tâm + tiêu chuẩn

#### Lợi ích của cách ĐÚNG

- Nhất quán lâu dài

---

---

## 16. Ánh xạ ESLint / Công cụ thực thi

Mỗi quy tắc trên **BẮT BUỘC** có thể thực thi bằng công cụ. Chỉ thực thi thủ công là không chấp nhận trong dự án Angular 21.x doanh nghiệp.

### Công cụ yêu cầu

- `@angular-eslint/*`
- `eslint-config-prettier`
- `eslint-plugin-rxjs-angular`
- `typescript-eslint`

### Ánh xạ quy tắc cốt lõi

| Vùng                    | ESLint / Công cụ                                          | Mục đích                                                                 |
| ----------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------ |
| Cấu trúc tính năng      | Nx / custom lint                                          | Ngăn import chéo tính năng                                               |
| OnPush mặc định         | angular-eslint/prefer-on-push-component-change-detection  | Ép hiệu năng                                                             |
| Async pipe              | angular-eslint/template/no-call-expression                | Tránh logic trong template                                               |
| trackBy                 | angular-eslint/template/use-track-by-function             | Tránh re-render DOM                                                       |
| Không side-effect trong component | Quy tắc tùy chỉnh / cổng review                          | Ép side-effect chỉ trong Facade (không subscribe trong component/store)  |
| Dùng Signals            | Quy tắc kiến trúc tùy chỉnh                               | Ngăn async trong Store; RxJS chỉ trong Facade cho I/O                     |

**Quy tắc (Chuẩn mực):** PR **BẮT BUỘC BỊ TỪ CHỐI** nếu ESLint fail.

---

## 17. Checklist hiệu năng Angular 21.x

Checklist này **BẮT BUỘC được xác thực trước khi phát hành production**.

### ❌ SAI

- Change detection mặc định mọi nơi
- Signals dùng cho dữ liệu async/server
- Template lớn chứa logic

#### Vì sao SAI

- Re-render không cần thiết
- Lỗi hiệu năng khó gỡ
- Hiệu năng mobile kém

### ✅ ĐÚNG

- `OnPush` trên mọi component mặc định
- **Trạng thái domain** trong Store (Signals); **component** chỉ dùng Signals cho trạng thái UI cục bộ hoặc đọc từ Store/Facade
- Async và `subscribe()` chỉ trong Facade; async pipe trong template khi dùng Observables
- `trackBy` (hoặc `track`) trên mọi `*ngFor` / `@for`
- Route tính năng lazy-loaded

#### Lợi ích của cách ĐÚNG

- Render dự đoán được
- Core Web Vitals tốt hơn
- Mở rộng cho dataset và team lớn

### Quy tắc hiệu năng bắt buộc

- ❗ Không `ChangeDetectionStrategy.Default` nếu không có lý do
- ❗ Không logic async trong Signals
- ❗ Không `subscribe()` trong component
- ❗ Không logic trong template ngoài binding

---

## 18. Chính sách sử dụng AI (Doanh nghiệp)

Công cụ AI **CÓ THỂ** được dùng, nhưng tuân theo quy tắc chặt chẽ.

### Công cụ được phép

- Cursor
- GitHub Copilot
- ChatGPT

### ❌ SAI

- Dán mù quáng code do AI tạo
- Dùng AI cho quyết định kiến trúc mà không review
- Commit code AI mà không hiểu

#### Vì sao SAI

- Lỗi và rủi ro bảo mật ẩn
- Kiến trúc không nhất quán
- Nợ kiến thức trong team

### ✅ ĐÚNG

- AI dùng cho boilerplate, refactor, tài liệu
- Mọi code do AI tạo được con người review
- Quyết định kiến trúc được tech lead phê duyệt

#### Lợi ích của cách ĐÚNG

- Phát triển nhanh hơn
- Mẫu nhất quán
- Rủi ro kiểm soát được

### Quy tắc bắt buộc

- Đầu ra AI **BẮT BUỘC** tuân theo tiêu chuẩn mã nguồn này
- AI **KHÔNG ĐƯỢC** bỏ qua ESLint, test hoặc review
- Trách nhiệm cuối cùng thuộc về developer

---

---

## 19. Phụ lục bảo mật (OWASP Top 10 → Angular 21.x)

Phần này ánh xạ **rủi ro OWASP Top 10** sang thực hành Angular 21.x cụ thể.

### A01: Kiểm soát truy cập bị phá vỡ

❌ SAI

```ts
if (user.role === 'ADMIN') {
  showAdminPanel();
}
```

#### Vì sao SAI

- Kiểm tra phía client có thể bị bỏ qua

✅ ĐÚNG

```ts
canActivate: [AdminGuard]
```

#### Lợi ích của cách ĐÚNG

- Thực thi ở tầng routing
- Phòng thủ nhiều lớp

**Lưu ý:** Route guard vẫn là phía client. Kiểm soát truy cập **BẮT BUỘC** cũng được thực thi ở backend (ví dụ Spring Security); guard bảo vệ UX và ẩn UI, không phải bảo mật.

---

### A03: Injection (XSS)

❌ SAI

```html
<div [innerHTML]="html"></div>
```

#### Vì sao SAI

- Cho phép chèn script

✅ ĐÚNG

```html
<div>{{ value }}</div>
```

#### Lợi ích của cách ĐÚNG

- Angular sanitize mặc định

---

### A05: Cấu hình bảo mật sai

❌ SAI — Cấu hình không an toàn

```ts
bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(), // không có interceptors
  ]
});
```

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval'">
```

#### Vì sao SAI

- Không có kiểm soát bảo mật tập trung
- CSP cho phép script inline và eval
- Dễ bị XSS và tấn công supply-chain

✅ ĐÚNG — Cấu hình an toàn mặc định

```ts
bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor, csrfInterceptor]))
  ]
});
```

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'">
```

#### Lợi ích của cách ĐÚNG

- Thực thi chính sách bảo mật tập trung
- Giảm thiểu XSS ở trình duyệt
- Khớp hướng dẫn Trusted Types & CSP Angular 21.x

---

## 20. Nx / Quy tắc ranh giới module (Bắt buộc)

Dự án Angular doanh nghiệp **BẮT BUỘC** ép ranh giới.

### ❌ SAI — Import chéo tính năng

```ts
import { UsersFacade } from '../users/data-access';
```

#### Vì sao SAI

- Liên kết ẩn
- Phá cô lập tính năng

### ✅ ĐÚNG — Chỉ public API

```ts
import { UsersFacade } from '@app/users';
```

#### Lợi ích của cách ĐÚNG

- Đồ thị phụ thuộc rõ
- Refactor an toàn

### Quy tắc Nx bắt buộc

```json
{
  "@nx/enforce-module-boundaries": [
    "error",
    {
      "enforceBuildableLibDependency": true,
      "allow": [],
      "depConstraints": [
        {
          "sourceTag": "type:feature",
          "onlyDependOnLibsWithTags": ["type:ui", "type:data-access"]
        }
      ]
    }
  ]
}
```
