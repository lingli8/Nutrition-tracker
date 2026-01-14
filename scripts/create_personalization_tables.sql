-- Create personalization tables for memory-based recommendations

-- User food preferences table
CREATE TABLE IF NOT EXISTS user_food_preferences (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    food_id BIGINT NOT NULL,
    times_eaten INT NOT NULL DEFAULT 0,
    times_recommended INT NOT NULL DEFAULT 0,
    times_accepted INT NOT NULL DEFAULT 0,
    times_rejected INT NOT NULL DEFAULT 0,
    acceptance_rate DOUBLE DEFAULT 0.0,
    last_eaten_date DATETIME,
    last_recommended_date DATETIME,
    last_rejected_date DATETIME,
    average_meal_time VARCHAR(20),
    preference_score DOUBLE DEFAULT 0.0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_food (user_id, food_id),
    INDEX idx_user_preference_score (user_id, preference_score),
    INDEX idx_user_acceptance_rate (user_id, acceptance_rate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User taste profile table
CREATE TABLE IF NOT EXISTS user_taste_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    preference_vegetables DOUBLE DEFAULT 0.5,
    preference_fruits DOUBLE DEFAULT 0.5,
    preference_grains DOUBLE DEFAULT 0.5,
    preference_protein DOUBLE DEFAULT 0.5,
    preference_dairy DOUBLE DEFAULT 0.5,
    preference_legumes DOUBLE DEFAULT 0.5,
    preference_nuts_seeds DOUBLE DEFAULT 0.5,
    preference_seafood DOUBLE DEFAULT 0.5,
    preference_poultry DOUBLE DEFAULT 0.5,
    preference_red_meat DOUBLE DEFAULT 0.5,
    prefers_high_protein BOOLEAN DEFAULT FALSE,
    prefers_low_carb BOOLEAN DEFAULT FALSE,
    prefers_plant_based BOOLEAN DEFAULT FALSE,
    breakfast_eater BOOLEAN DEFAULT TRUE,
    typical_meals_per_day INT DEFAULT 3,
    snacks_per_day INT DEFAULT 2,
    likes_spicy BOOLEAN,
    likes_sweet BOOLEAN,
    likes_savory BOOLEAN,
    total_meals_logged INT DEFAULT 0,
    confidence_level DOUBLE DEFAULT 0.0,
    last_updated DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_confidence (user_id, confidence_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recommendation feedback table
CREATE TABLE IF NOT EXISTS recommendation_feedback (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    food_id BIGINT NOT NULL,
    recommendation_context VARCHAR(500),
    user_action VARCHAR(20) NOT NULL,
    feedback_reason VARCHAR(500),
    cycle_phase VARCHAR(20),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE,
    INDEX idx_user_action (user_id, user_action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for better query performance
CREATE INDEX idx_user_food_last_eaten ON user_food_preferences(user_id, last_eaten_date);
CREATE INDEX idx_user_food_meal_time ON user_food_preferences(user_id, average_meal_time);
