# 💰 Budget Flow - Financial Management Application

A comprehensive financial management application with a **Spring Boot backend** and a **React frontend** using **Material UI**. This application allows users to manage financial accounts, track income/expenses, set budgets, and generate reports.

## 🚀 Features
- ✅ **User Authentication & Authorization** (JWT-based)
- ✅ **Modern Material UI Interface**
- ✅ **Responsive Design** for all devices
- ✅ **Accounts Management** (Checking, Savings, Investment)
- ✅ **Transactions Tracking** (Income, Expenses, Transfers)
- ✅ **Budgeting & Savings Goals**
- ✅ **Financial Reports & Audit Logs**
- ✅ **Contact Form** with EmailJS integration
- ✅ **User Profile Management**

---

## 📦 Project Structure

### 📱 Frontend Structure
```
financial-management-frontend/financeapp/
├── public/                  # Static files
├── src/
│   ├── config/              # Configuration files
│   │   └── emailjs.config.js
│   ├── pages/               # Application pages
│   │   ├── account/         # Account management
│   │   │   └── DeleteAccount.jsx
│   │   ├── api/             # API related components
│   │   ├── auth/            # Authentication pages
│   │   │   ├── ActivateAccount.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── ResetPassword.jsx
│   │   ├── user/            # User management
│   │   │   ├── DeleteUser.jsx
│   │   │   └── Profile.jsx
│   │   ├── Contact.jsx      # Contact page
│   │   ├── dashboard.jsx    # Dashboard page
│   │   ├── home.jsx         # Home page
│   │   └── Index.jsx        # Index page
│   ├── services/            # Service files
│   │   └── emailjs.js
│   ├── App.jsx              # Main application component
│   └── main.jsx             # Entry point
└── package.json             # Dependencies and scripts
```

### 🖥️ Backend Structure
```
financial-management-backend/
├── src/main/
│   ├── java/com/budgetflow/
│   │   ├── config/          # Configuration files
│   │   ├── controller/      # REST controllers
│   │   ├── dto/             # Data Transfer Objects
│   │   ├── exception/       # Custom exceptions
│   │   ├── model/           # Entity models
│   │   ├── repository/      # Data repositories
│   │   ├── security/        # Security configuration
│   │   ├── service/         # Business logic
│   │   └── util/            # Utility classes
│   └── resources/
│       ├── application.properties  # Application configuration
│       └── db/                     # Database migrations
└── pom.xml                         # Dependencies and build config
```

---

## 📦 Setup Instructions

### 🛠 **1. Prerequisites**
- **Java 17**
- **Node.js 18+**
- **MySQL**
- **Git**

### 📥 **2. Clone the repository**
```sh
git clone https://github.com/yourusername/Budget-Flow.git
cd Budget-Flow
```

### ⚙️ **3. Backend Setup**
#### Configure MySQL
Create a database named **`finance_db`** and update the **`application.properties`** file:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/finance_db
spring.datasource.username=root
spring.datasource.password=yourpassword
spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
```

#### Run the Backend
```sh
cd financial-management-backend
./mvnw spring-boot:run
```

### 🎨 **4. Frontend Setup**
```sh
cd financial-management-frontend/financeapp
npm install
npm run dev
```

The application will be available at **`http://localhost:3000`**

---

## 🔑 **Authentication (JWT)**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login & get JWT token |
| `POST` | `/api/auth/logout` | Logout user |
| `POST` | `/api/auth/forgot-password` | Request password reset |
| `POST` | `/api/auth/reset-password` | Reset password with token |
| `POST` | `/api/auth/activate-account` | Activate account with token |

---

## 📜 **API Endpoints**

### 👤 **Users API (`/api/users`)**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users` | Get all users (Admin only) |
| `GET` | `/api/users/{id}` | Get user details |
| `PUT` | `/api/users/{id}` | Update user profile |
| `DELETE` | `/api/users/{id}` | Delete user account |

### 💳 **Accounts API (`/api/accounts`)**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/accounts` | Get all accounts |
| `POST` | `/api/accounts` | Create a new account |
| `GET` | `/api/accounts/{id}` | Get account details |
| `PUT` | `/api/accounts/{id}` | Update account balance |
| `DELETE` | `/api/accounts/{id}` | Delete account |

### 💰 **Transactions API (`/api/transactions`)**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/transactions` | Get all transactions |
| `POST` | `/api/transactions` | Add a new transaction |
| `GET` | `/api/transactions/{id}` | Get transaction details |
| `PUT` | `/api/transactions/{id}` | Update transaction |
| `DELETE` | `/api/transactions/{id}` | Delete transaction |

### 📊 **Reports API (`/api/reports`)**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports/monthly-summary?userId=2&month=3&year=2024` | Get user's monthly financial summary |

---

## 📱 **Frontend Routes**
| Route | Description | Access |
|-------|-------------|--------|
| `/` | Home page | Public |
| `/login` | Login page | Public |
| `/register` | Registration page | Public |
| `/forgot-password` | Forgot password page | Public |
| `/reset-password` | Reset password page | Public |
| `/activate-account` | Account activation page | Public |
| `/dashboard` | User dashboard | Authenticated |
| `/profile` | User profile | Authenticated |
| `/contact` | Contact page | Public |
| `/admin/users` | User management | Admin |
| `/account/delete` | Delete account | Authenticated |

---

## 🔐 **Security & Authentication**
- **Spring Security** is used to secure API endpoints.
- **JWT Authentication** for secure user sessions.
- **EmailJS Integration** for account activation and password reset.

---

## 🛠 **Tech Stack**
- **Backend:** Spring Boot, Spring Security, Hibernate, MySQL
- **Frontend:** React, Vite, Material UI, React Router
- **Authentication:** JWT-based authentication
- **Email Service:** EmailJS
- **Database:** MySQL

---

## 🤝 **Contributing**
1. Fork the repo
2. Create a new branch (`feature/new-feature`)
3. Commit changes & push
4. Open a pull request

---

## 📄 **License**
This project is licensed under the **MIT License**.

