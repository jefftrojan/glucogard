# Glucogard

Glucogard is a mobile application designed to help manage and monitor glucose levels for diabetic patients, facilitating better communication between patients and doctors.

## Table of Contents

- [Project Title and Description](#glucogard)
- [Table of Contents](#table-of-contents)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Key Features](#key-features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Installation

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v18.x or later recommended)
- npm (comes with Node.js) or yarn
- Expo CLI
  ```sh
  npm install -g expo-cli
  ```
- Supabase Account and Project Setup:
    1. Create an account at [Supabase](https://supabase.com).
    2. Create a new project.
    3. Obtain your Project URL and `anon` key from the API settings.

### Setup

1.  **Clone the repository:**
    ```sh
    git clone <YOUR_REPOSITORY_URL>
    cd glucogard
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```
    or if you prefer yarn:
    ```sh
    yarn install
    ```

3.  **Configure Supabase:**
    Create a `.env` file in the root of the project (or update your environment variables directly) with your Supabase credentials. This file should be added to `.gitignore`.
    ```
    EXPO_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```
    You will need to update `lib/supabase.ts` if you choose a different way to manage these environment variables. Currently, it expects them to be available via `process.env`.

4.  **Apply Supabase Migrations:**
    Ensure you have the Supabase CLI installed and configured.
    ```sh
    supabase login
    supabase link --project-ref <YOUR_PROJECT_ID>
    supabase db push
    ```
    Alternatively, you can run the SQL files in the `supabase/migrations` directory directly in your Supabase project's SQL editor in the correct order.

## Running the Application

1.  **Start the development server:**
    ```sh
    npm start
    ```
    or
    ```sh
    expo start
    ```
    This will open the Expo Developer Tools in your browser. You can then:
    - Run on an Android emulator/device
    - Run on an iOS simulator/device
    - Run in a web browser

## Key Features

- User authentication (registration and login) for patients and doctors.
- Separate dashboards for patients and doctors.
- Glucose level tracking for patients.
- Patient list and data viewing for doctors.
- Profile management.

## Technologies Used

- **Frontend:**
    - React Native
    - Expo
    - TypeScript
- **Backend & Database:**
    - Supabase (PostgreSQL, Auth, Realtime)
- **Styling:** (Assumed, based on typical React Native development)
- **Navigation:** React Navigation (Expo Router)

## Project Structure

```
glucogard/
├── .gitignore
├── app.json                 # Expo configuration
├── package.json             # Project dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── app/                     # Main application code (screens, navigation)
│   ├── (tabs)/              # Tab-based navigation layout
│   ├── auth/                # Authentication screens
│   ├── _layout.tsx          # Root layout
│   └── index.tsx            # Entry point for the app
├── assets/                  # Static assets (images, fonts)
├── components/              # Reusable UI components
├── context/                 # React Context API for global state
│   └── AuthContext.tsx      # Authentication state management
├── hooks/                   # Custom React hooks
├── lib/                     # Utility functions, Supabase client setup
│   ├── auth.ts              # Authentication helper functions
│   └── supabase.ts          # Supabase client initialization
├── supabase/                # Supabase specific files
│   └── migrations/          # Database schema migrations
└── types/                   # TypeScript type definitions
    └── database.ts          # Types generated from Supabase schema (potentially)
```

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE.txt` for more information. (Note: You'll need to create a LICENSE.txt file if you want to include one).
