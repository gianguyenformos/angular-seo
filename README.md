# AngularSeo

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

======================================================

# Bắt đầu với SSR
- Node 22.21.1
- Angular 21.0.0
- Tạo mới dự án có SSR
  $ ng new my-app --ssr
- Thêm SSR vào dự án hiện có
  $ ng add @angular/ssr
- Tích hợp Jhipster vào trong Angular SSR
  + Tạo mới Jhipster client: https://www.jhipster.tech/separating-front-end-and-api/
    $ jhipster --skip-server --auth=jwt
  + Copy source code từ <Jhipster Project>/src/main/webapp/app/core vào trong <Angular SSR Project>/src/app
- Lưu access token vào trong Cookie để có thể share data cho SSR, SSG: src\app\core\auth\state-storage.service.ts
- Tạo mới Jhipster server: https://www.jhipster.tech/separating-front-end-and-api/
  $ jhipster --skip-client
  + Disable docker compose when run Java app in application.yml
    spring:
      application:
        name: api
      docker:
        compose:
          enabled: false
          lifecycle-management: start-only
          file: src/main/docker/services.yml
  + Update CORS in application-dev.yml
    jhipster:
      cache: # Cache configuration
        ehcache: # Ehcache configuration
          time-to-live-seconds: 3600 # By default objects stay 1 hour in the cache
          max-entries: 100 # Number of objects in each cache entry
      # CORS is only enabled by default with the "dev" profile
      cors:
        # Allow Ionic for JHipster by default (* no longer allowed in Spring Boot 2.4+)
        allowed-origins: 'http://localhost:8100,https://localhost:8100,http://localhost:4200,http://localhost:4000'
        # Enable CORS when running in GitHub Codespaces
- CSR, SSR, SSG:
  + src\app\app.routes.ts
  + src\app\app.routes.server.ts
  + CSR:
    login: src\app\pages\login\login.component.ts
    csr: src\app\pages\csr-dashboard\csr-dashboard.component.ts
  + SSR:
    ssr: src\app\pages\ssr-stock\ssr-stock.component.ts
  + SSG:
    $ ng build
    product/:id: src\app\pages\product-detail\product-detail.component.ts
    ssg: src\app\pages\ssg-about\ssg-about.component.ts





