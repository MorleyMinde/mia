# Mtuniafya

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.10.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Firebase emulators with persisted data

Run both Angular dev server and the Firebase emulators (Auth, Firestore, Functions, Hosting, UI) with:

```bash
npm run dev
```

The `firebase.json` configuration together with the updated npm scripts ensures emulator state is exported to `.firebase/emulator-data` when you stop the emulators and is automatically re-imported the next time you start them. This means Firestore documents, Auth users, and other emulator data will survive restarts.

- `npm run emulators` – start emulators only with automatic save/restore.
- `npm run emulators:export` – manually snapshot current emulator data.
- `npm run emulators:import` – import a snapshot without running the Angular dev server.
- `npm run emulators:clean` – delete the saved emulator data to start fresh.

To inspect or manage the emulators visually, open the Emulator UI at `http://localhost:4000`.

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

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

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
