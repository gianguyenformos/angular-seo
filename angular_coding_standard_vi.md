# Tiêu chuẩn mã nguồn Angular (Angular 21.x)

Phạm vi: Ứng dụng frontend dùng **Angular 21.x**\
Backend: REST / JSON (Spring Boot hoặc tương đương)

---

## 1. Cấu trúc dự án

**Quy tắc (Chuẩn mực):** Các nhóm **BẮT BUỘC** dùng kiến trúc phân lớp theo tính năng (feature-first). Mỗi tính năng sở hữu UI, state và truy cập dữ liệu của riêng mình.

### ❌ SAI — Cấu trúc theo loại

```
components/
services/
models/
```

#### Vì sao SAI

- Không có quyền sở hữu rõ ràng theo tính năng
- Ghép nối cao giữa các tính năng không liên quan
- Khó xóa, tái cấu trúc hoặc mở rộng từng tính năng độc lập

### ✅ ĐÚNG — Cấu trúc theo tính năng

```
users/
  pages/
  ui/
  data-access/
  users.routes.ts
```

#### Lợi ích của ĐÚNG

- Quyền sở hữu rõ ràng theo từng tính năng
- Hỗ trợ lazy loading và tái cấu trúc độc lập
- Mở rộng tốt cho team lớn

---

## 2. Quản lý state (Chỉ dùng Angular Signals)

**Quy tắc (Chuẩn mực):** Ứng dụng Angular **BẮT BUỘC dùng Angular Signals** (`signal`, `computed`, `effect`) để quản lý state.

---

### 2.1 State của component

**Quy tắc (Chuẩn mực):** Component **CHỈ** quản lý state cục bộ, chỉ phục vụ hiển thị (công tắc UI, lựa chọn).

### ❌ SAI — Component nắm state nghiệp vụ

```ts
users = signal<User[]>([]);
ngOnInit() {
  this.api.getUsers().subscribe(u => this.users.set(u));
}
```

#### Vì sao SAI

- Component trộn lẫn UI và dữ liệu
- Side-effect bất đồng bộ ẩn trong tầng UI
- State bị hủy khi component bị teardown

### ✅ ĐÚNG — Component đọc từ Signals Store

```ts
users = this.usersStore.users;
```

#### Lợi ích của ĐÚNG

- Component không giữ state
- Tách biệt rõ trách nhiệm
- Render dễ dự đoán

---

### 2.2 Signals Store (State thuộc service)

**Quy tắc (Chuẩn mực):** State ứng dụng và dùng chung **BẮT BUỘC** nằm trong các service có thể inject, dùng Signals.

### ❌ SAI — State dùng chung có thể thay đổi trong service

```ts
@Injectable()
export class UserService {
  users: User[] = [];
}
```

#### Vì sao SAI

- State có thể thay đổi
- Không theo dõi thay đổi
- Khó test

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

#### Lợi ích của ĐÚNG

- Một nguồn sự thật
- Phản ứng theo kiểu Angular
- Dễ unit test

---

### 2.3 State dẫn xuất với `computed`

**Quy tắc (Chuẩn mực):** State dẫn xuất **BẮT BUỘC** khai báo bằng `computed()` trong store.

### ❌ SAI — Tính toán trong component

```ts
activeUsers = this.usersStore.users().filter(u => u.active);
```

#### Vì sao SAI

- Trùng lặp logic
- Tính lại mỗi lần render

### ✅ ĐÚNG — State dẫn xuất tập trung

```ts
readonly activeUsers = computed(() =>
  this._users().filter(u => u.active)
);
```

#### Lợi ích của ĐÚNG

- Memo hóa
- Logic nghiệp vụ tập trung

---

### 2.4 Cách ly side-effect (BẮT BUỘC)

**Mục tiêu**\
Cách ly chặt chẽ mọi side-effect (HTTP, timer, API trình duyệt, logging) khỏi logic state để đảm bảo **state dự đoán được, dễ test và an toàn SSR**.

---

### Trách nhiệm từng tầng (BẮT BUỘC)

| Tầng | File | Trách nhiệm | Được dùng HttpClient | Sở hữu Signals |
|------|------|-------------|----------------------|----------------|
| API | `users.api.ts` | Chỉ gọi HTTP mức thấp | ✅ CÓ | ❌ KHÔNG |
| Store | `users.store.ts` | State + computed + mutation đồng bộ thuần | ❌ KHÔNG | ✅ CÓ |
| Facade | `users.facade.ts` | Điều phối side-effect và cập nhật state | ✅ CÓ | ❌ KHÔNG |

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
  - Giữ state (Signals, Subjects)
  - Chứa logic nghiệp vụ

- Facade **KHÔNG ĐƯỢC**:
  - Khai báo Signals
  - Expose state có thể thay đổi

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

### ✅ ĐÚNG — Phân tách rõ ràng

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

**Lợi ích của ĐÚNG**

- Một trách nhiệm mỗi file
- Store thuần và đồng bộ
- Facade kiểm soát toàn bộ side-effect
- Tầng API dễ mock
- An toàn SSR và mở rộng được cho doanh nghiệp

---

**Quy tắc (Chuẩn mực):** Side-effect **BẮT BUỘC** được cách ly bằng `effect()` hoặc phương thức service rõ ràng.

### ❌ SAI — Side-effect trong component

```ts
save() {
  this.http.post('/api/users', this.user).subscribe();
}
```

#### Vì sao SAI

- Không test được
- Hành vi bất đồng bộ ẩn

### ✅ ĐÚNG — Side-effect dựa trên effect

```ts
effect(() => {
  if (this._loading()) {
    console.log('Loading users');
  }
});
```

#### Lợi ích của ĐÚNG

- Nhận biết vòng đời
- Có thể test
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
- Khó áp dụng ranh giới

### ✅ ĐÚNG — Tầng data-access rõ ràng

```
users/
  pages/
  ui/
  data-access/
    users.store.ts
    users.api.ts
```

#### Lợi ích của ĐÚNG

- Quyền sở hữu state rõ
- Ranh giới có thể áp dụng
- Mở rộng tốt cho nhiều team

---

### 2.6 Mẫu bất đồng bộ & HTTP (Signals + RxJS)

**Quy tắc (Chuẩn mực):** RxJS **CHỈ** dùng cho I/O. **Mọi subscription và luồng bất đồng bộ BẮT BUỘC nằm ở tầng Facade.** Store **BẮT BUỘC đồng bộ và không có side-effect**.

---

### ❌ SAI — Logic bất đồng bộ trong component

```ts
ngOnInit() {
  this.http.get<User[]>('/api/users').subscribe(u => this.users.set(u));
}
```

**Vì sao SAI**

- Logic bất đồng bộ ẩn trong UI
- Không tái sử dụng được
- Khó test

---

### ❌ SAI — Logic bất đồng bộ trong Store

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
- Vi phạm quy tắc cách ly (2.4)
- Không an toàn SSR

---

### ✅ ĐÚNG — Bất đồng bộ ở Facade, state ở Store

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

**Lợi ích của ĐÚNG**

- Một ranh giới bất đồng bộ
- Store thuần và đồng bộ
- Khớp với Cách ly Side-effect (2.4)
- An toàn SSR và có thể test

---

### 2.7 Mẫu state lỗi & loading (BẮT BUỘC)

**Quy tắc (Chuẩn mực):** State loading và lỗi **BẮT BUỘC** lưu dưới dạng Signals rõ ràng trong Store và **CHỈ được thay đổi bởi Facade**.

---

### ❌ SAI — State bất đồng bộ ngầm định

```ts
this.http.get('/api/users').subscribe(users => this._users.set(users));
```

**Vì sao SAI**

- Không có signal loading
- Không xử lý lỗi
- UI không phản ứng xác định được

---

### ❌ SAI — Store đổi loading trong lúc làm việc bất đồng bộ

```ts
load(): void {
  this._loading.set(true);
  this.api.load().subscribe(() => this._loading.set(false));
}
```

**Vì sao SAI**

- Store sở hữu vòng đời bất đồng bộ
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

**Lợi ích của ĐÚNG**

- Trạng thái UI xác định
- Quyền sở hữu rõ ràng vòng đời bất đồng bộ
- Nhất quán với Mục 2.4 và 2.6
- Dễ test và lý giải

---

### 2.8 Chiến lược test cho Signals Store (BẮT BUỘC)

**Quy tắc (Chuẩn mực):** Signals Store **BẮT BUỘC** được unit test trực tiếp, không dùng TestBed.

❌ SAI — Test qua component

```ts
render(UsersComponent);
```

**Vì sao SAI**

- Chậm
- Test UI thay vì hành vi

✅ ĐÚNG — Test store trực tiếp

```ts
it('adds user', () => {
  const store = new UsersStore(mockApi);
  store.addUser({ id: 1, name: 'Alice' });
  expect(store.users()).toHaveLength(1);
});
```

**Lợi ích của ĐÚNG**

- Test nhanh
- Assertion xác định
- Không phụ thuộc TestBed của Angular

---

### 2.9 Quy tắc SSR + Signals (Angular 21.x) (BẮT BUỘC)

**Mục tiêu**\
Đảm bảo Signals **hoạt động an toàn và dự đoán được trong SSR và hydration**, tránh lệch DOM và lỗi phụ thuộc môi trường.

---

#### 🚫 CẤM TUYỆT ĐỐI

- `effect()` **KHÔNG ĐƯỢC**:
  - Gọi API HTTP trong SSR
  - Truy cập `window`, `document`, `localStorage`
  - Thực hiện mutation state bất đồng bộ trong SSR

- Store **KHÔNG ĐƯỢC**:
  - Tải dữ liệu bất đồng bộ
  - Phụ thuộc điều kiện môi trường runtime

---

#### ✅ QUY TẮC BẮT BUỘC

- Việc tải dữ liệu **CHỈ ĐƯỢC** chạy khi:
  - `isPlatformBrowser()` === `true`

- Trong giai đoạn SSR:
  - Signals có thể **chỉ đọc**
  - **KHÔNG cho phép** mutation state

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
constructor() {
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

❌ SAI — Công việc bất đồng bộ trong signal

```ts
users = signal(this.http.get('/api/users'));
```

**Vì sao SAI**

- Phá tính xác định của SSR
- Gây lệch hydration

✅ ĐÚNG — Mẫu an toàn SSR

```ts
loadOnClient(): void {
  if (isPlatformBrowser(this.platformId)) {
    this.load();
  }
}
```

**Lợi ích của ĐÚNG**

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

#### Lợi ích của ĐÚNG

- Hiệu năng tốt hơn
- Luồng dữ liệu rõ ràng

---

### 3.2 Inputs & Outputs

**Quy tắc (Chuẩn mực):** Component **NÊN** “dumb” mặc định và **KHÔNG ĐƯỢC** chứa logic nghiệp vụ.

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

#### Lợi ích của ĐÚNG

- Trách nhiệm rõ
- Dễ test

---

## 4. Templates

### 4.1 Async Pipe

### ❌ SAI

```html
{{ users | async | json }}
```

#### Vì sao SAI

- Nhiều subscription
- Logic template không rõ

### ✅ ĐÚNG

```html
<ng-container *ngIf="users$ | async as users">
```

#### Lợi ích của ĐÚNG

- Một subscription
- Template dễ đọc

---

## 5. Hiệu năng

### 5.1 trackBy

### ❌ SAI

```html
<li *ngFor="let u of users">{{u.name}}</li>
```

#### Vì sao SAI

- Render lại toàn bộ DOM khi thay đổi

### ✅ ĐÚNG

```html
<li *ngFor="let u of users; trackBy: trackById">{{u.name}}</li>
```

#### Lợi ích của ĐÚNG

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

#### Lợi ích của ĐÚNG

- An toàn mặc định

---

## 7. Testing

### ❌ SAI

```ts
test('component saves', () => {});
```

#### Vì sao SAI

- Test UI thay vì hành vi

### ✅ ĐÚNG

```ts
test('facade dispatches save action', () => {});
```

#### Lợi ích của ĐÚNG

- Test ổn định, nhanh

---

## 8. Truy cập (Accessibility)

### ❌ SAI

```html
<div (click)="save()">Save</div>
```

#### Vì sao SAI

- Không truy cập được bằng bàn phím

### ✅ ĐÚNG

```html
<button (click)="save()">Save</button>
```

#### Lợi ích của ĐÚNG

- Truy cập được mặc định

---

## 9. i18n

### ❌ SAI

```html
<h1>Hello</h1>
```

#### Vì sao SAI

- Chuỗi hardcode

### ✅ ĐÚNG

```html
<h1>{{ 'HELLO' | translate }}</h1>
```

#### Lợi ích của ĐÚNG

- Dễ bản địa hóa

---

## 10. Linting & Formatting

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

#### Lợi ích của ĐÚNG

- Dễ đọc và có thể áp dụng bằng tool

---

## 11. CI/CD

### ❌ SAI

- Chỉ review thủ công

#### Vì sao SAI

- Áp dụng không nhất quán

### ✅ ĐÚNG

- ESLint + Prettier + Tests trong pipeline

#### Lợi ích của ĐÚNG

- Cổng chất lượng tự động

---

## 12. Tài liệu

### ❌ SAI

```ts
// TODO
```

#### Vì sao SAI

- Không ghi rõ ý định

### ✅ ĐÚNG

```ts
/** Loads users from API */
```

#### Lợi ích của ĐÚNG

- Dễ onboard

---

## 13. Quản lý phụ thuộc

### ❌ SAI

- Nâng phiên bản ngẫu nhiên

#### Vì sao SAI

- Rủi ro breaking change

### ✅ ĐÚNG

- Nâng cấp minor Angular 21.x theo lịch

#### Lợi ích của ĐÚNG

- Bảo trì dự đoán được

---

## 14. Chiến lược nâng cấp

### ❌ SAI

- Bỏ qua các phiên bản major

#### Vì sao SAI

- Nợ kỹ thuật tích tụ

### ✅ ĐÚNG

- Làm theo Angular update guide từng bản phát hành

#### Lợi ích của ĐÚNG

- Nâng cấp an toàn, từng bước

---

## 15. Quản trị kiến trúc

### ❌ SAI

- Mỗi team tự quyết định mẫu

#### Vì sao SAI

- Kiến trúc không nhất quán

### ✅ ĐÚNG

- Ban kiến trúc trung tâm + chuẩn chung

#### Lợi ích của ĐÚNG

- Nhất quán lâu dài

---

---

## 16. Ánh xạ ESLint / Công cụ thực thi

Mỗi quy tắc trên **BẮT BUỘC** có thể thực thi bằng công cụ. Chỉ thực thi thủ công là không chấp nhận trong dự án Angular 21.x doanh nghiệp.

### Công cụ bắt buộc

- `@angular-eslint/*`
- `eslint-config-prettier`
- `eslint-plugin-rxjs-angular`
- `typescript-eslint`

### Ánh xạ quy tắc cốt lõi

| Khu vực | ESLint / Công cụ | Mục đích |
|---------|------------------|----------|
| Cấu trúc tính năng | Nx / custom lint | Ngăn import chéo tính năng |
| OnPush mặc định | angular-eslint/prefer-on-push-component-change-detection | Ép hiệu năng |
| Async pipe | angular-eslint/template/no-call-expression | Tránh logic trong template |
| trackBy | angular-eslint/template/use-track-by-function | Tránh re-render DOM |
| Không side-effect trong component | custom rule / review gate | Ép NgRx effects |
| Dùng Signals | custom architecture rule | Ngăn lạm dụng async |

**Quy tắc (Chuẩn mực):** PR **BẮT BUỘC BỊ FAIL** nếu ESLint fail.

---

## 17. Checklist hiệu năng Angular 21.x

Checklist này **BẮT BUỘC được kiểm tra trước khi release production**.

### ❌ SAI

- Change detection mặc định mọi nơi
- Dùng Signals cho dữ liệu async/server
- Template lớn chứa logic

#### Vì sao SAI

- Re-render không cần thiết
- Vấn đề hiệu năng khó debug
- Hiệu năng mobile kém

### ✅ ĐÚNG

- `OnPush` trên mọi component mặc định
- Signals chỉ cho state UI cục bộ
- Async pipe + facades
- `trackBy` trên mọi `*ngFor`
- Route tính năng lazy-loaded

#### Lợi ích của ĐÚNG

- Render dự đoán được
- Core Web Vitals tốt hơn
- Mở rộng cho dataset và team lớn

### Quy tắc hiệu năng bắt buộc

- ❗ Không dùng `ChangeDetectionStrategy.Default` nếu không có lý do
- ❗ Không đưa logic async vào Signals
- ❗ Không `subscribe()` trong component
- ❗ Không logic trong template ngoài binding

---

## 18. Chính sách dùng AI (Doanh nghiệp)

Có **ĐƯỢC** dùng công cụ AI, nhưng tuân theo quy tắc chặt chẽ.

### Công cụ cho phép

- Cursor
- GitHub Copilot
- ChatGPT

### ❌ SAI

- Dán code do AI tạo mà không kiểm tra
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

#### Lợi ích của ĐÚNG

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

#### Lợi ích của ĐÚNG

- Thực thi ở tầng routing
- Phòng thủ nhiều lớp

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

#### Lợi ích của ĐÚNG

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
- CSP cho phép inline script và eval
- XSS và tấn công supply-chain dễ xảy ra

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

#### Lợi ích của ĐÚNG

- Thực thi chính sách bảo mật tập trung
- Giảm thiểu XSS ở trình duyệt
- Khớp hướng dẫn Trusted Types & CSP Angular 21.x

---

## 20. Quy tắc Nx / Ranh giới module (Bắt buộc)

Dự án Angular doanh nghiệp **BẮT BUỘC** thực thi ranh giới.

### ❌ SAI — Import chéo tính năng

```ts
import { UsersFacade } from '../users/data-access';
```

#### Vì sao SAI

- Ghép nối ẩn
- Phá cách ly tính năng

### ✅ ĐÚNG — Chỉ dùng public API

```ts
import { UsersFacade } from '@app/users';
```

#### Lợi ích của ĐÚNG

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
