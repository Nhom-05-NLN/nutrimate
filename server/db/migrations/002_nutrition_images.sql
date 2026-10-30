BEGIN;

CREATE TABLE IF NOT EXISTS nutrition_images (
    image_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL UNIQUE,
    ocr_text TEXT,
    upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL CHECK (status IN ('processing', 'completed', 'unrecognized', 'failed')),
    predicted_calories DOUBLE PRECISION,
    predicted_protein DOUBLE PRECISION,
    predicted_carbs DOUBLE PRECISION,
    predicted_fat DOUBLE PRECISION,
    predicted_sugar DOUBLE PRECISION
);

CREATE INDEX IF NOT EXISTS idx_nutrition_images_customer_date
    ON nutrition_images(customer_id, upload_date DESC);

COMMIT;
