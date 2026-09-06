import os
import requests
from dotenv import load_dotenv

load_dotenv()

client_id = os.getenv("SENTINEL_HUB_CLIENT_ID")
client_secret = os.getenv("SENTINEL_HUB_CLIENT_SECRET")

token_url = "https://services.sentinel-hub.com/auth/realms/main/protocol/openid-connect/token"

response = requests.post(
    token_url,
    data={
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
    },
)

print("Status code:", response.status_code)

if response.ok:
    print("Planet authentication successful!")
else:
    print("Planet authentication failed.")
    print(response.text)