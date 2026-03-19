from PIL import Image
try:
    with Image.open('d:/Antigravity/cso_solar/public/doc/shema_hibrud.jpg') as img:
        print(f"Width: {img.width}")
        print(f"Height: {img.height}")
except Exception as e:
    print(e)
