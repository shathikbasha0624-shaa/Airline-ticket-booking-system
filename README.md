# ✈️ SkyWings Airlines - Ticket Booking & Operations System

A full-stack enterprise airline booking, passenger reservation, and administrative flight scheduling platform built with **Node.js (Express)**, **Microsoft SQL Server (MSSQL)**, and modern **Vanilla HTML5/CSS3/JavaScript**.

---

## 🌟 Key Features

### 👤 Passenger Portal
* **Live Flight Search & Multi-Filter Console:** Search by origin, destination, or flight code. Filter and sort by Price (Low to High, High to Low) or Departure Date.
* **Interactive Multi-Tier Seat Selection:**
  * 💺 **Economy Class:** Standard seating, 23kg baggage, complimentary meal.
  * 💼 **Business Class:** 2.0x base fare, priority boarding, airport lounge access.
  * 👑 **First Class:** 3.0x base fare, luxury lie-flat suite, champagne, fine dining.
* **Real-Time Fare Computation:** Dynamically calculates base fare, tier multiplier, and aviation taxes.
* **Digital Boarding Pass (E-Ticket):** Generates official electronic boarding passes with passenger name, flight number, seat assignment, gate, and simulated barcode with 1-click print support.
* **Trip History & Cancellation:** Monitor active bookings and cancel flights on demand.

### 🛡️ Admin Command Center
* **Operations Analytics:** Real-time KPI metrics tracking Scheduled Flights, Total Passenger Bookings, Gross Revenue ($), and Active Passengers.
* **1-Click Route Presets:** Pre-fills popular international commercial flight routes (London, Tokyo, Dubai, Singapore, New York, Paris).
* **Flight Inventory Management:** Publish new commercial flights directly to the schedule or delete existing ones.
* **Global Passenger Bookings Supervisor:** Real-time search filter across all bookings by passenger name, email, or flight number, with administrative cancellation controls.

### 🔒 Security & Data Integrity
* **Windows Integrated Authentication:** Seamless native connection via `msnodesqlv8` and `ODBC Driver 17 for SQL Server`.
* **Password Encryption:** Bcrypt salted password hashing.
* **Role-Based Access Control (RBAC):** Distinct passenger and admin authorization levels.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3 (Modern Glassmorphism & Animations), Vanilla ES6+ JavaScript |
| **Backend** | Node.js (v22), Express.js (v5.x), CORS, Dotenv |
| **Database** | Microsoft SQL Server (MSSQL), `msnodesqlv8` (ODBC Driver 17) |
| **Authentication** | Bcrypt.js, LocalStorage Session Management |

---

## 📂 Project Architecture

```
Airline ticket booking system/
├── Client/                     # Frontend UI & Logic
│   ├── index.html              # Split-Hero Luxury Authentication Page
│   ├── app.js                  # Auth logic & Toast notification engine
│   ├── dashboard.html          # Passenger Portal & Booking Experience
│   ├── dashboard.js            # Flight search, modal & boarding pass logic
│   ├── admin-dashboard.html    # Operations & Admin Command Center
│   ├── admin-dashboard.js      # Flight publishing & global booking supervisor
│   └── style.css               # Design system, animations & responsive styling
├── Server/                     # Backend API & Database Layer
│   ├── config/
│   │   └── db.js               # MSSQL ODBC connection pool
│   ├── controllers/
│   │   ├── authController.js   # Sign in & Sign up logic
│   │   ├── flightController.js # Flight schedule & deletion logic
│   │   └── bookingController.js# Multi-tier booking & cancellation logic
│   ├── routes/
│   │   ├── authRoutes.js       # /api/auth endpoints
│   │   ├── flightRoutes.js     # /api/flights endpoints
│   │   └── bookingRoutes.js    # /api/bookings endpoints
│   ├── server.js               # Express application entry point
│   └── .env                    # Database configuration parameters
├── database_setup.sql          # Primary database & schema creation script
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
* **Node.js** (v18 or higher)
* **Microsoft SQL Server** (2017 or higher)
* **ODBC Driver 17 for SQL Server** installed

### 2. Database Initialization
Run `database_setup.sql` in **SQL Server Management Studio (SSMS)** or **Azure Data Studio** to create the `Airline` database and tables.

### 3. Server Configuration & Launch
```cmd
cd "D:\Airline ticket booking system\Server"
npm install
npm start
```

### 4. Access Application
Open your web browser and navigate to:
**`http://localhost:3000`**

* **Admin Demo Login:** `admin@gmail.com` / `123456`
* **Customer Demo Login:** `test@skywings.com` / `123456`
