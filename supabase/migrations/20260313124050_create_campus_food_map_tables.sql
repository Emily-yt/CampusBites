/*
  # Campus Food Map Database Schema

  1. New Tables
    - `restaurants`
      - `id` (uuid, primary key)
      - `name` (text) - Restaurant name
      - `description` (text) - Restaurant description
      - `cuisine_type` (text) - Type of cuisine (Chinese, Western, Japanese, etc.)
      - `school` (text) - Nearby school/campus
      - `address` (text) - Full address
      - `distance_km` (numeric) - Distance from school in kilometers
      - `avg_price` (numeric) - Average price per person
      - `phone` (text) - Contact phone number
      - `hours` (text) - Operating hours
      - `image_url` (text) - Main image URL
      - `rating` (numeric) - Average rating (0-5)
      - `review_count` (integer) - Number of reviews
      - `is_new` (boolean) - Is this a new restaurant
      - `is_late_night` (boolean) - Open late night
      - `created_at` (timestamptz) - Creation timestamp

    - `reviews`
      - `id` (uuid, primary key)
      - `restaurant_id` (uuid, foreign key) - Reference to restaurant
      - `user_name` (text) - Reviewer name
      - `rating` (integer) - Rating (1-5)
      - `content` (text) - Review content
      - `images` (text[]) - Array of image URLs
      - `helpful_count` (integer) - Number of helpful votes
      - `created_at` (timestamptz) - Creation timestamp

    - `menu_items`
      - `id` (uuid, primary key)
      - `restaurant_id` (uuid, foreign key) - Reference to restaurant
      - `name` (text) - Dish name
      - `price` (numeric) - Dish price
      - `description` (text) - Dish description
      - `image_url` (text) - Dish image URL
      - `is_recommended` (boolean) - Is this a recommended dish
      - `created_at` (timestamptz) - Creation timestamp

    - `favorites`
      - `id` (uuid, primary key)
      - `user_session` (text) - User session identifier
      - `restaurant_id` (uuid, foreign key) - Reference to restaurant
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for authenticated operations
*/

CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  cuisine_type text NOT NULL,
  school text NOT NULL,
  address text NOT NULL,
  distance_km numeric NOT NULL DEFAULT 0,
  avg_price numeric NOT NULL DEFAULT 0,
  phone text DEFAULT '',
  hours text DEFAULT '',
  image_url text DEFAULT '',
  rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  review_count integer DEFAULT 0,
  is_new boolean DEFAULT false,
  is_late_night boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content text NOT NULL,
  images text[] DEFAULT ARRAY[]::text[],
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  description text DEFAULT '',
  image_url text DEFAULT '',
  is_recommended boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_session text NOT NULL,
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_session, restaurant_id)
);

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view restaurants"
  ON restaurants FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can view menu items"
  ON menu_items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can view favorites"
  ON favorites FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert reviews"
  ON reviews FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can insert favorites"
  ON favorites FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can delete their favorites"
  ON favorites FOR DELETE
  TO public
  USING (true);

CREATE INDEX IF NOT EXISTS idx_restaurants_school ON restaurants(school);
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine ON restaurants(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_restaurants_rating ON restaurants(rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant ON reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_favorites_session ON favorites(user_session);
