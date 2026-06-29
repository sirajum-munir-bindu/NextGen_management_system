from PIL import Image
import os

input_path = "/app/../frontend/public/favicon.png"
# wait, docker backend only has /app mapped. 
# It doesn't have access to frontend folder.
