-- Create meal planning tables

CREATE TABLE IF NOT EXISTS meal_plans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    plan_name VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    cycle_phase VARCHAR(20),
    target_calories INT,
    target_protein DOUBLE,
    target_carbs DOUBLE,
    target_fat DOUBLE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_active (user_id, is_active),
    INDEX idx_date_range (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS planned_meals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    meal_plan_id BIGINT NOT NULL,
    food_id BIGINT NOT NULL,
    meal_date DATE NOT NULL,
    meal_time VARCHAR(20) NOT NULL,
    portion_grams DOUBLE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at DATETIME,
    reason_selected VARCHAR(500),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE,
    INDEX idx_plan_date (meal_plan_id, meal_date),
    INDEX idx_plan_time (meal_plan_id, meal_time),
    INDEX idx_completed (meal_plan_id, is_completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
