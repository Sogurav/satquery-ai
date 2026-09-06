from app.services.sentinel import fetch_satellite_image


bbox = [
    72.82,
    18.92,
    72.84,
    18.94,
]

start_date = "2026-01-01"
end_date = "2026-01-31"


print("Requesting satellite image...")

image = fetch_satellite_image(
    bbox=bbox,
    start_date=start_date,
    end_date=end_date,
)


with open("test_satellite_2.png", "wb") as file:
    file.write(image.image_bytes)


print("Satellite image downloaded successfully!")
print("Saved as: test_satellite_2.png")
