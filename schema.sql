CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, name)
);


CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),

    category VARCHAR(100) NOT NULL,

    description TEXT NOT NULL,

    date DATE NOT NULL,

    notes TEXT,

    payment_method VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,

    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    month VARCHAR(7) NOT NULL,

    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, month)
);


CREATE TABLE IF NOT EXISTS recurring_expenses (
    id SERIAL PRIMARY KEY,

    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),

    category VARCHAR(100) NOT NULL,

    description TEXT NOT NULL,

    notes TEXT,

    payment_method VARCHAR(50),

    start_date DATE NOT NULL,

    next_due_date DATE NOT NULL,

    frequency VARCHAR(20) NOT NULL
        CHECK (
            frequency IN (
                'weekly',
                'monthly',
                'yearly'
            )
        ),

    active BOOLEAN DEFAULT TRUE,

    last_generated_date DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,

    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    type VARCHAR(50) NOT NULL,

    title VARCHAR(255) NOT NULL,

    message TEXT NOT NULL,

    read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,

    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    notifications_enabled BOOLEAN DEFAULT TRUE,

    budget_notifications_enabled BOOLEAN DEFAULT TRUE,

    recurring_notifications_enabled BOOLEAN DEFAULT TRUE,

    dark_mode BOOLEAN DEFAULT FALSE,

    pin_lock_enabled BOOLEAN DEFAULT FALSE,

    pin_hash TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);