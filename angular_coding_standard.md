# Angular Coding Standards (Angular 21.x)

Scope: Frontend applications using **Angular 21.x**\
Backend: REST / JSON (Spring Boot or equivalent)

---

## 1. Project Structure

**Rule (Normative):** Teams **MUST** use a feature-first, layered architecture. Each feature owns its UI, state, and data access.

### ❌ BAD — Type-based structure

```
components/
services/
models/
```

#### Why BAD

- No clear feature ownership
- High coupling between unrelated features
- Hard to delete, refactor, or scale features independently

### ✅ GOOD — Feature-based structure

```
users/
  pages/
  ui/
  data-access/
  users.routes.ts
```

#### Benefits of GOOD

- Clear ownership per feature
- Enables lazy loading and independent refactoring
- Scales well for large teams

---

## 2. State Management (Angular Signals Only)

**Rule (Normative):** Angular applications **MUST use Angular Signals** (`signal`, `computed`, `effect`) for state management.

---

### 2.1 Component State

**Rule (Normative):** Components **MUST** manage only local, presentation-only state (UI toggles, selections).

### ❌ BAD — Component owns business state

```ts
users = signal<User[]>([]);
ngOnInit() {
  this.api.getUsers().subscribe(u => this.users.set(u));
}
```

#### Why BAD

- Component mixes UI and data concerns
- Async side-effects hidden in UI layer
- State is destroyed on component teardown

### ✅ GOOD — Component reads from Signals Store

```ts
users = this.usersStore.users;
```

#### Benefits of GOOD

- Stateless components
- Clean separation of concerns
- Predictable rendering

---

### 2.2 Signals Store (Service-owned State)

**Rule (Normative):** Application and shared state **MUST** live in injectable services using Signals.

### ❌ BAD — Mutable shared service state

```ts
@Injectable()
export class UserService {
  users: User[] = [];
}
```

#### Why BAD

- Mutable state
- No change tracking
- Hard to test

### ✅ GOOD — Signals-based Store Service

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

#### Benefits of GOOD

- Single source of truth
- Angular-native reactivity
- Easy unit testing

---

### 2.3 Derived State with `computed`

**Rule (Normative):** Derived state **MUST** be declared using `computed()` inside the store.

### ❌ BAD — Derivation in component

```ts
activeUsers = this.usersStore.users().filter(u => u.active);
```

#### Why BAD

- Logic duplication
- Recomputed on every render

### ✅ GOOD — Centralized derived state

```ts
readonly activeUsers = computed(() =>
  this._users().filter(u => u.active)
);
```

#### Benefits of GOOD

- Memoized
- Business logic centralized

---

### 2.4 Side-Effects Isolation (MANDATORY)

**Objective**\
Strictly isolate all side-effects (HTTP, timers, browser APIs, logging) from state logic to ensure **predictable state, high testability, and full SSR safety**.

---

### Layer Responsibilities (MANDATORY)

| Layer | File | Responsibility | Allowed to use HttpClient | Owns Signals |
|------|------|---------------|----------------------------|--------------|
| API | `users.api.ts` | Low-level HTTP calls only | ✅ YES | ❌ NO |
| Store | `users.store.ts` | State + computed + pure sync mutations | ❌ NO | ✅ YES |
| Facade | `users.facade.ts` | Orchestrates side-effects and state updates | ✅ YES | ❌ NO |

---

**Definition of Side-Effects**

- HTTP / WebSocket / EventSource calls
- `setTimeout`, `setInterval`
- `localStorage`, `sessionStorage`, `window`, `document`
- Router navigation
- Logging / analytics

---

### 🚫 STRICTLY FORBIDDEN

- Store **MUST NOT**:
  - Call HTTP APIs
  - Inject `HttpClient`
  - Access browser-only APIs
  - Contain `subscribe()`

- API **MUST NOT**:
  - Hold state (Signals, Subjects)
  - Contain business logic

- Facade **MUST NOT**:
  - Declare Signals
  - Expose mutable state

---

### ❌ BAD — Collapsed responsibilities

```ts
// users.service.ts ❌ everything mixed together
@Injectable()
export class UsersService {
  users = signal<User[]>([]);

  load() {
    this.http.get<User[]>('/api/users').subscribe(u => this.users.set(u));
  }
}
```

**Why BAD**

- No clear boundaries
- Impossible to test in isolation
- SSR unsafe

---

### ✅ GOOD — Clear separation

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

**Benefits of GOOD**

- Single responsibility per file
- Stores are pure and synchronous
- Facade fully controls side-effects
- API layer is trivially mockable
- SSR-safe and enterprise-scalable

---

**Rule (Normative):** Side-effects **MUST** be isolated using `effect()` or explicit service methods.

### ❌ BAD — Side-effects in component

```ts
save() {
  this.http.post('/api/users', this.user).subscribe();
}
```

#### Why BAD

- Not testable
- Hidden async behavior

### ✅ GOOD — Effect-based side-effects

```ts
effect(() => {
  if (this._loading()) {
    console.log('Loading users');
  }
});
```

#### Benefits of GOOD

- Lifecycle-aware
- Testable
- Predictable

---

### 2.5 Signals Store Folder Convention (MANDATORY)

**Rule (Normative):** Each feature **MUST** expose exactly one Signals Store under a `data-access` layer.

### ❌ BAD — Store mixed with UI

```
users/
  users.component.ts
  users.store.ts
```

#### Why BAD

- Blurs UI vs state responsibilities
- Hard to enforce boundaries

### ✅ GOOD — Explicit data-access layer

```
users/
  pages/
  ui/
  data-access/
    users.store.ts
    users.api.ts
```

#### Benefits of GOOD

- Clear ownership of state
- Enforceable boundaries
- Scales across teams

---

### 2.6 Async & HTTP Pattern (Signals + RxJS)

**Rule (Normative):** RxJS **MUST** be used only for I/O. **All subscriptions and async flows MUST live in the Facade layer.** Stores **MUST remain synchronous and side‑effect free**.

---

### ❌ BAD — Async logic inside component

```ts
ngOnInit() {
  this.http.get<User[]>('/api/users').subscribe(u => this.users.set(u));
}
```

**Why BAD**

- Async logic hidden in UI
- Not reusable
- Hard to test

---

### ❌ BAD — Async logic inside Store

```ts
@Injectable({ providedIn: 'root' })
export class UsersStore {
  private readonly _users = signal<User[]>([]);

  load(): void {
    this.api.load().subscribe(users => this._users.set(users));
  }
}
```

**Why BAD**

- Store owns side-effects
- Violates isolation rules (2.4)
- Not SSR-safe

---

### ✅ GOOD — Async in Facade, state in Store

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

**Benefits of GOOD**

- Single async boundary
- Store is pure and synchronous
- Fully aligned with Side‑Effects Isolation (2.4)
- SSR‑safe and testable

---

### 2.7 Error & Loading State Pattern (MANDATORY)

**Rule (Normative):** Loading and error state **MUST** be stored as explicit Signals in the Store and **MUST be mutated only by the Facade**.

---

### ❌ BAD — Implicit async state

```ts
this.http.get('/api/users').subscribe(users => this._users.set(users));
```

**Why BAD**

- No loading signal
- No error handling
- UI cannot react deterministically

---

### ❌ BAD — Store mutates loading during async work

```ts
load(): void {
  this._loading.set(true);
  this.api.load().subscribe(() => this._loading.set(false));
}
```

**Why BAD**

- Store owns async lifecycle
- Violates Facade responsibility

---

### ✅ GOOD — Facade controls lifecycle, Store holds state

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

**Benefits of GOOD**

- Deterministic UI states
- Clear ownership of async lifecycle
- Consistent with Sections 2.4 and 2.6
- Easy to test and reason about

---

### 2.8 Testing Strategy for Signals Store (MANDATORY)

**Rule (Normative):** Signals Stores **MUST** be unit-tested directly without TestBed.

❌ BAD — Testing through component

```ts
render(UsersComponent);
```

**Why BAD**

- Slow
- Tests UI instead of behavior

✅ GOOD — Direct store testing

```ts
it('adds user', () => {
  const store = new UsersStore(mockApi);
  store.addUser({ id: 1, name: 'Alice' });
  expect(store.users()).toHaveLength(1);
});
```

**Benefits of GOOD**

- Fast tests
- Deterministic assertions
- No Angular TestBed overhead

---

### 2.9 SSR + Signals Rules (Angular 21.x) (MANDATORY)

**Objective**\
Ensure Signals behave **safely and predictably in SSR and hydration**, preventing DOM mismatches and environment-specific bugs.

---

#### 🚫 STRICTLY FORBIDDEN

- `effect()` **MUST NOT**:

  - Call HTTP APIs during SSR
  - Access `window`, `document`, `localStorage`
  - Perform asynchronous state mutations during SSR

- Store **MUST NOT**:

  - Load data asynchronously
  - Depend on runtime environment conditions

---

#### ✅ MANDATORY RULES

- Data loading **MUST ONLY** run when:

  - `isPlatformBrowser()` === `true`

- During SSR phase:

  - Signals may be **read-only**
  - State mutation is **NOT allowed**

---

#### BAD (Hydration Bug Example)

```ts
// ❌ effect executes during SSR
constructor() {
  effect(() => {
    this.http.get('/api/data').subscribe(...);
  });
}
```

---

#### GOOD (SSR-safe Pattern)

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

#### ⭐ ENTERPRISE RECOMMENDATIONS

- SSR data fetching **SHOULD** be implemented via:

  - Angular Route `resolve()`
  - `TransferState`

- Signals **MUST ONLY** consume data that has already been hydrated

- Signals **MUST NOT** initiate SSR-side data fetching

---

❌ BAD — Async work in signal

```ts
users = signal(this.http.get('/api/users'));
```

**Why BAD**

- Breaks SSR determinism
- Causes hydration mismatch

✅ GOOD — SSR-safe pattern

```ts
loadOnClient(): void {
  if (isPlatformBrowser(this.platformId)) {
    this.load();
  }
}
```

**Benefits of GOOD**

- Predictable SSR
- Safe hydration
- Aligned with Angular 21 SSR model

---

## 3. Components

### 3.1 Change Detection

**Rule (Normative):** Components **MUST** use `ChangeDetectionStrategy.OnPush` by default.

### ❌ BAD

```ts
@Component({})
```

#### Why BAD

- Unnecessary change detection cycles
- Performance degradation

### ✅ GOOD

```ts
@Component({ changeDetection: ChangeDetectionStrategy.OnPush })
```

#### Benefits of GOOD

- Better performance
- Explicit data flow

---

### 3.2 Inputs & Outputs

**Rule (Normative):** Components **SHOULD** be dumb by default and **MUST NOT** contain business logic.

### ❌ BAD

```ts
@Input() user!: User;
this.api.save(user);
```

#### Why BAD

- Component performs business logic
- Hard to reuse

### ✅ GOOD

```ts
@Output() save = new EventEmitter<User>();
```

#### Benefits of GOOD

- Clear responsibility
- Easier testing

---

## 4. Templates

### 4.1 Async Pipe

### ❌ BAD

```html
{{ users | async | json }}
```

#### Why BAD

- Multiple subscriptions
- Unclear template logic

### ✅ GOOD

```html
<ng-container *ngIf="users$ | async as users">
```

#### Benefits of GOOD

- Single subscription
- Readable templates

---

## 5. Performance

### 5.1 trackBy

### ❌ BAD

```html
<li *ngFor="let u of users">{{u.name}}</li>
```

#### Why BAD

- Full DOM re-render on changes

### ✅ GOOD

```html
<li *ngFor="let u of users; trackBy: trackById">{{u.name}}</li>
```

#### Benefits of GOOD

- Efficient DOM updates

---

## 6. Security

### ❌ BAD

```html
<div [innerHTML]="html"></div>
```

#### Why BAD

- XSS vulnerability

### ✅ GOOD

```html
<div>{{ text }}</div>
```

#### Benefits of GOOD

- Safe by default

---

## 7. Testing

### ❌ BAD

```ts
test('component saves', () => {});
```

#### Why BAD

- Tests UI instead of behavior

### ✅ GOOD

```ts
test('facade dispatches save action', () => {});
```

#### Benefits of GOOD

- Stable, fast tests

---

## 8. Accessibility

### ❌ BAD

```html
<div (click)="save()">Save</div>
```

#### Why BAD

- Not keyboard accessible

### ✅ GOOD

```html
<button (click)="save()">Save</button>
```

#### Benefits of GOOD

- Accessible by default

---

## 9. i18n

### ❌ BAD

```html
<h1>Hello</h1>
```

#### Why BAD

- Hardcoded strings

### ✅ GOOD

```html
<h1>{{ 'HELLO' | translate }}</h1>
```

#### Benefits of GOOD

- Easy localization

---

## 10. Linting & Formatting

### ❌ BAD

```ts
if(x==y){do();}
```

#### Why BAD

- Inconsistent style

### ✅ GOOD

```ts
if (x === y) {
  do();
}
```

#### Benefits of GOOD

- Readable and enforceable

---

## 11. CI/CD

### ❌ BAD

- Manual review only

#### Why BAD

- Inconsistent enforcement

### ✅ GOOD

- ESLint + Prettier + Tests in pipeline

#### Benefits of GOOD

- Automatic quality gate

---

## 12. Documentation

### ❌ BAD

```ts
// TODO
```

#### Why BAD

- No intent documented

### ✅ GOOD

```ts
/** Loads users from API */
```

#### Benefits of GOOD

- Easier onboarding

---

## 13. Dependency Management

### ❌ BAD

- Random version upgrades

#### Why BAD

- Risk of breaking changes

### ✅ GOOD

- Scheduled Angular 21.x minor upgrades

#### Benefits of GOOD

- Predictable maintenance

---

## 14. Upgrade Strategy

### ❌ BAD

- Skip major versions

#### Why BAD

- Accumulated technical debt

### ✅ GOOD

- Follow Angular update guide per release

#### Benefits of GOOD

- Safe, incremental upgrades

---

## 15. Architecture Governance

### ❌ BAD

- Each team decides patterns

#### Why BAD

- Inconsistent architecture

### ✅ GOOD

- Central architecture board + standards

#### Benefits of GOOD

- Long-term consistency

---

---

## 16. ESLint / Tooling Enforcement Mapping

Each rule above **MUST** be enforceable via tooling. Manual enforcement alone is not acceptable in enterprise Angular 21.x projects.

### Required Tooling

- `@angular-eslint/*`
- `eslint-config-prettier`
- `eslint-plugin-rxjs-angular`
- `typescript-eslint`

### Core Rule Mapping

| Area                          | ESLint / Tool                                            | Purpose                       |
| ----------------------------- | -------------------------------------------------------- | ----------------------------- |
| Feature structure             | Nx / custom lint                                         | Prevent cross-feature imports |
| OnPush default                | angular-eslint/prefer-on-push-component-change-detection | Enforce performance           |
| Async pipe                    | angular-eslint/template/no-call-expression               | Avoid logic in templates      |
| trackBy                       | angular-eslint/template/use-track-by-function            | Prevent DOM re-render         |
| No side-effects in components | custom rule / review gate                                | Enforce NgRx effects          |
| Signals usage                 | custom architecture rule                                 | Prevent async misuse          |

**Rule (Normative):** A PR **MUST FAIL** if ESLint fails.

---

## 17. Angular 21.x Performance Checklist

This checklist **MUST be validated before production release**.

### ❌ BAD

- Default change detection everywhere
- Signals used for async/server data
- Large templates with logic

#### Why BAD

- Unnecessary re-renders
- Hard-to-debug performance issues
- Poor mobile performance

### ✅ GOOD

- `OnPush` on all components by default
- Signals only for local UI state
- Async pipe + facades
- `trackBy` on all `*ngFor`
- Lazy-loaded feature routes

#### Benefits of GOOD

- Predictable rendering
- Better Core Web Vitals
- Scales to large datasets and teams

### Mandatory Performance Rules

- ❗ No `ChangeDetectionStrategy.Default` without justification
- ❗ No async logic in Signals
- ❗ No `subscribe()` in components
- ❗ No template logic beyond bindings

---

## 18. AI Usage Policy (Enterprise)

AI tools **MAY be used**, but are governed by strict rules.

### Allowed Tools

- Cursor
- GitHub Copilot
- ChatGPT

### ❌ BAD

- Blindly pasting AI-generated code
- Using AI for architecture decisions without review
- Committing AI code without understanding it

#### Why BAD

- Hidden bugs and security risks
- Inconsistent architecture
- Knowledge debt in the team

### ✅ GOOD

- AI used for boilerplate, refactoring, documentation
- All AI-generated code reviewed by humans
- Architecture decisions approved by tech leads

#### Benefits of GOOD

- Faster development
- Consistent patterns
- Controlled risk

### Mandatory Rules

- AI output **MUST** follow this coding standard
- AI **MUST NOT** bypass ESLint, tests, or reviews
- Final responsibility remains with the developer

---

---

## 19. Security Appendix (OWASP Top 10 → Angular 21.x)

This section maps **OWASP Top 10 risks** to concrete Angular 21.x practices.

### A01: Broken Access Control

❌ BAD

```ts
if (user.role === 'ADMIN') {
  showAdminPanel();
}
```

#### Why BAD

- Client-side checks are bypassable

✅ GOOD

```ts
canActivate: [AdminGuard]
```

#### Benefits of GOOD

- Enforcement at routing level
- Defense in depth

---

### A03: Injection (XSS)

❌ BAD

```html
<div [innerHTML]="html"></div>
```

#### Why BAD

- Enables script injection

✅ GOOD

```html
<div>{{ value }}</div>
```

#### Benefits of GOOD

- Angular sanitization by default

---

### A05: Security Misconfiguration

❌ BAD — Insecure configuration

```ts
bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(), // no interceptors
  ]
});
```

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval'">
```

#### Why BAD

- No centralized security controls
- CSP allows inline scripts and eval
- Makes XSS and supply-chain attacks trivial

✅ GOOD — Secure-by-default configuration

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

#### Benefits of GOOD

- Centralized enforcement of security policies
- Browser-level mitigation of XSS
- Aligned with Angular 21.x Trusted Types & CSP guidance

---

## 20. Nx / Module Boundary Rules (Mandatory)

Enterprise Angular projects **MUST enforce boundaries**.

### ❌ BAD — Cross-feature imports

```ts
import { UsersFacade } from '../users/data-access';
```

#### Why BAD

- Hidden coupling
- Breaks feature isolation

### ✅ GOOD — Public API only

```ts
import { UsersFacade } from '@app/users';
```

#### Benefits of GOOD

- Clear dependency graph
- Safe refactoring

### Mandatory Nx Rules

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



