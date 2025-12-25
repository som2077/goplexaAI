# snip.py
import os
import sys
import time
import json
import tkinter as tk
from PIL import ImageGrab

class SnippingTool:
    def __init__(self, root):
        self.root = root
        self.root.title("Snipping Tool")

        # semi-transparent fullscreen overlay
        self.root.attributes('-alpha', 0.3)
        self.root.attributes('-topmost', True)
        try:
            self.root.attributes('-fullscreen', True)
        except:
            # fallback for some platforms
            self.root.geometry(f"{self.root.winfo_screenwidth()}x{self.root.winfo_screenheight()}+0+0")

        self.root.configure(bg='gray')
        # screenshots folder path
        self.screenshot_dir = r'C:\Screenshots'
        os.makedirs(self.screenshot_dir, exist_ok=True)

        self.start_x = None
        self.start_y = None
        self.current_x = None
        self.current_y = None
        self.rect = None

        self.canvas = tk.Canvas(root, cursor="cross", bg='#000000', highlightthickness=0)
        self.overlay = self.canvas.create_rectangle(
            0, 0, root.winfo_screenwidth(), root.winfo_screenheight(),
            fill='black', stipple='gray50', state='hidden'
        )
        self.canvas.pack(fill=tk.BOTH, expand=True)

        self.canvas.bind("<ButtonPress-1>", self.on_button_press)
        self.canvas.bind("<B1-Motion>", self.on_mouse_drag)
        self.canvas.bind("<ButtonRelease-1>", self.on_button_release)

        self.root.bind("<Escape>", self.quit_application)
        self.root.bind("q", self.quit_application)

    def create_rounded_rect(self, x1, y1, x2, y2, radius=2, **kwargs):
        points = [
            x1 + radius, y1,
            x2 - radius, y1,
            x2, y1,
            x2, y1 + radius,
            x2, y2 - radius,
            x2, y2,
            x2 - radius, y2,
            x1 + radius, y2,
            x1, y2,
            x1, y2 - radius,
            x1, y1 + radius,
            x1, y1
        ]
        return self.canvas.create_polygon(points, **kwargs, smooth=True, splinesteps=20)

    def on_button_press(self, event):
        self.start_x = event.x
        self.start_y = event.y
        self.canvas.itemconfig(self.overlay, state='normal')

        self.rect = self.create_rounded_rect(
            self.start_x, self.start_y,
            self.start_x, self.start_y,
            radius=10,
            outline='#3498db',
            width=2,
            fill='#90c9f7',
            stipple='gray50',
            dash=(4, 4)
        )

    def on_mouse_drag(self, event):
        self.current_x, self.current_y = event.x, event.y

        if self.rect:
            self.canvas.delete(self.rect)
            x1, y1 = min(self.start_x, self.current_x), min(self.start_y, self.current_y)
            x2, y2 = max(self.start_x, self.current_x), max(self.start_y, self.current_y)

            self.rect = self.create_rounded_rect(
                x1, y1, x2, y2,
                radius=5,
                outline='#3498db',
                width=0.1,
                fill='#90c9f7',
                stipple='gray50',
                dash=(4, 4)
            )

    def on_button_release(self, event):
        if all(v is not None for v in [self.start_x, self.start_y, self.current_x, self.current_y]):
            x1 = min(self.start_x, self.current_x)
            y1 = min(self.start_y, self.current_y)
            x2 = max(self.start_x, self.current_x)
            y2 = max(self.start_y, self.current_y)

            if abs(x2 - x1) < 5 or abs(y2 - y1) < 5:
                self.canvas.delete(self.rect)
                return

            try:
                # hide overlay so screenshot doesn't include UI
                self.root.withdraw()
                time.sleep(0.2)

                screenshot = ImageGrab.grab(bbox=(x1, y1, x2, y2))

                timestamp = time.strftime("%Y%m%d_%H%M%S")
                filename = os.path.join(self.screenshot_dir, f"screenshot_{timestamp}.png")
                screenshot.save(filename)

                # print JSON path so Electron main can parse it
                print(json.dumps({"path": filename}))
                sys.stdout.flush()

            except Exception as e:
                print(json.dumps({"error": str(e)}))
                sys.stdout.flush()
            finally:
                self.quit_application()

    def quit_application(self, event=None):
        if hasattr(self, 'overlay'):
            self.canvas.itemconfig(self.overlay, state='hidden')
        try:
            self.root.destroy()
        except:
            pass
        sys.exit()

def main():
    root = tk.Tk()
    try:
        app = SnippingTool(root)
        root.mainloop()
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.stdout.flush()
        sys.exit(1)

if __name__ == "__main__":
    main()
