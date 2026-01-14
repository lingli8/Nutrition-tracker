CREATE TABLE IF NOT EXISTS achievements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    icon VARCHAR(100) NOT NULL,
    points INT NOT NULL,
    unlock_criteria VARCHAR(500),
    rarity VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_achievements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    achievement_id BIGINT NOT NULL,
    unlocked_at TIMESTAMP NOT NULL,
    progress INT DEFAULT 0,
    is_displayed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_achievement (user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS user_stats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    total_points INT DEFAULT 0,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    achievements_unlocked INT DEFAULT 0,
    meals_logged INT DEFAULT 0,
    goals_achieved INT DEFAULT 0,
    level INT DEFAULT 1,
    experience_points INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cycle_groups (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    target_phase VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    member_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Insert default achievements
INSERT INTO achievements (code, name, description, category, icon, points, unlock_criteria, rarity) VALUES
('FIRST_LOG', 'First Steps', 'Log your first meal', 'GETTING_STARTED', '🎯', 10, 'Log 1 meal', 'COMMON'),
('WEEK_WARRIOR', 'Week Warrior', 'Maintain a 7-day logging streak', 'STREAK', '🔥', 50, '7 day streak', 'RARE'),
('MONTH_MASTER', 'Month Master', 'Maintain a 30-day logging streak', 'STREAK', '💪', 200, '30 day streak', 'EPIC'),
('CENTURY_CHAMPION', 'Century Champion', 'Maintain a 100-day logging streak', 'STREAK', '👑', 1000, '100 day streak', 'LEGENDARY'),
('IRON_CHAMPION', 'Iron Champion', 'Meet iron goals for 7 consecutive days', 'NUTRITION', '⚡', 100, '7 days iron goal', 'RARE'),
('PROTEIN_POWER', 'Protein Power', 'Meet protein goals for 14 consecutive days', 'NUTRITION', '💪', 150, '14 days protein goal', 'EPIC'),
('CYCLE_SYNC', 'Cycle Synced', 'Follow phase-specific recommendations for a full cycle', 'CYCLE', '🌸', 300, 'Complete cycle following recommendations', 'EPIC'),
('MEAL_TRACKER_50', 'Meal Tracker 50', 'Log 50 meals', 'MILESTONE', '📊', 75, 'Log 50 meals', 'COMMON'),
('MEAL_TRACKER_200', 'Meal Tracker 200', 'Log 200 meals', 'MILESTONE', '📈', 200, 'Log 200 meals', 'RARE'),
('MEAL_TRACKER_1000', 'Meal Tracker 1000', 'Log 1000 meals', 'MILESTONE', '🏆', 1000, 'Log 1000 meals', 'LEGENDARY'),
('COMMUNITY_STAR', 'Community Star', 'Create 10 helpful community posts', 'SOCIAL', '⭐', 100, '10 community posts', 'RARE'),
('MENTOR', 'Mentor', 'Help 5 users in the community', 'SOCIAL', '🌟', 250, 'Help 5 users', 'EPIC');
