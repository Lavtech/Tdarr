import tkinter
import customtkinter
from tkinter import filedialog, messagebox
import os

# System settings
customtkinter.set_appearance_mode("System")  # Use system appearance
customtkinter.set_default_color_theme("blue")  # Set theme to blue

# Main app frame
app = customtkinter.CTk()

# Get screen width and height
screen_width = app.winfo_screenwidth()
screen_height = app.winfo_screenheight()

# Set window size to screen size
app.geometry(f"{screen_width}x{screen_height}")

app.title("TDarr Temp Cache File Finder")

# Title label
title = customtkinter.CTkLabel(app, text="Choose the directory you want to search.")
title.grid(row=0, column=0, columnspan=2, padx=20, pady=20, sticky="w")

# Function to format file sizes
def format_size(size):
    if size < 1024:
        return f"{size} bytes"
    elif size < 1024**2:
        return f"{size / 1024:.2f} KB"
    elif size < 1024**3:
        return f"{size / 1024**2:.2f} MB"
    elif size < 1024**4:
        return f"{size / 1024**3:.2f} GB"
    elif size < 1024**5:
        return f"{size / 1024**4:.2f} TB"
    else:
        return f"{size / 1024**5:.2f} PB"

# Function to open directory selection dialog
def select_directory():
    directory = filedialog.askdirectory()
    if directory:
        directory_label.configure(text=f"Selected: {directory}")
        app.selected_directory = directory
        search_button.configure(text="Search", state=tkinter.NORMAL)
        remove_button.configure(state=tkinter.DISABLED)
        total_size_label.configure(text="Total size of found files: 0 bytes")

# Button to select directory
select_button = customtkinter.CTkButton(app, text="Select Directory", command=select_directory)
select_button.grid(row=1, column=0, padx=20, pady=10, sticky="ew")

# Label to display selected directory
directory_label = customtkinter.CTkLabel(app, text="No directory selected")
directory_label.grid(row=1, column=1, padx=20, pady=10, sticky="w")

# Extension filter label
filter_label = customtkinter.CTkLabel(app, text="Enter extension you want to skip. Use a comma after the extension to enter multiple:")
filter_label.grid(row=2, column=0, columnspan=2, padx=20, pady=10, sticky="w")

# Entry for extensions to skip
extension_entry = customtkinter.CTkEntry(app, placeholder_text="")
extension_entry.grid(row=3, column=0, columnspan=1, padx=20, pady=10, sticky="ew")

# Search description label
search_description = customtkinter.CTkLabel(app, text="This will search the directory specified above for any files containing 'TdarrCacheFile' in the filename.")
search_description.grid(row=4, column=0, columnspan=2, padx=20, pady=10, sticky="w")

# List to store found files and total size
found_files = []
total_file_size = 0

# Function to search for files based on filenames and extensions
def search_directory(directory=None):
    if directory is None:
        directory = app.selected_directory

    files_found.configure(state='normal')
    files_found.delete('1.0', tkinter.END)
    global total_file_size
    total_file_size = 0
    found_files.clear()

    fixed_extensions_to_skip = ['.DS_Store', '.ignore', '.nfo']
    extensions_to_skip = extension_entry.get().replace(' ', '').split(',')
    extensions_to_skip = [ext.strip() for ext in extensions_to_skip if ext]
    extensions_to_skip.extend(fixed_extensions_to_skip)

    for root, dirs, files in os.walk(directory):
        for file in files:
            file_path = os.path.join(root, file)
            file_name, file_ext = os.path.splitext(file)
            if 'TdarrCacheFile' in file_path and file_ext[1:] not in extensions_to_skip:
                file_size = os.path.getsize(file_path)
                total_file_size += file_size
                files_found.insert(tkinter.END, f"Found file: {file_path} (Size: {format_size(file_size)})\n", 'highlight')
                found_files.append(file_path)

    files_found.configure(state='disabled')
    search_button.configure(text="Search Complete", state=tkinter.DISABLED)
    remove_button.configure(state=tkinter.NORMAL)
    total_size_label.configure(text=f"Total size of found files: {format_size(total_file_size)}")

# Function to remove found files
def remove_files():
    if messagebox.askyesno("Confirm Delete", "Are you sure you want to delete these files?"):
        for file_path in found_files:
            try:
                os.remove(file_path)
                files_found.configure(state='normal')
                files_found.insert(tkinter.END, f"Removed file: {file_path}\n", 'highlight')
                files_found.configure(state='disabled')
            except Exception as e:
                files_found.configure(state='normal')
                files_found.insert(tkinter.END, f"Failed to remove file: {file_path}. Error: {e}\n", 'highlight')
                files_found.configure(state='disabled')
        messagebox.showinfo("Deletion Complete", "Selected files have been removed.")
        remove_button.configure(state=tkinter.DISABLED)
        total_size_label.configure(text="Total size of found files: 0 bytes")

# Search button
search_button = customtkinter.CTkButton(app, text="Search", command=search_directory)
search_button.grid(row=5, column=0, columnspan=1, padx=20, pady=10, sticky="ew")

# Label for Ignore these subfolders
ignore_label = customtkinter.CTkLabel(app, text="Ignore these subfolders:")
ignore_label.grid(row=6, column=0, columnspan=1, padx=20, pady=10, sticky="w")

# Checkbox for Featurettes (checked by default)
featurettes_var = tkinter.BooleanVar(value=True)
featurettes_checkbox = customtkinter.CTkCheckBox(app, text="Featurettes", variable=featurettes_var)
featurettes_checkbox.grid(row=7, column=0, columnspan=1, padx=20, pady=10, sticky="w")

# Checkbox for Fanart (checked by default)
fanart_var = tkinter.BooleanVar(value=True)
fanart_checkbox = customtkinter.CTkCheckBox(app, text="Fanart", variable=fanart_var)
fanart_checkbox.grid(row=7, column=1, columnspan=1, padx=0, pady=0, sticky="w")

# Button to remove found files
remove_button = customtkinter.CTkButton(app, text="Remove These Files?", command=remove_files, state=tkinter.DISABLED)
remove_button.grid(row=8, column=0, columnspan=1, padx=20, pady=10, sticky="ew")

# Label to display total size of found files
total_size_label = customtkinter.CTkLabel(app, text="Total size of found files: 0 bytes")
total_size_label.grid(row=9, column=0, columnspan=2, padx=20, pady=10, sticky="w")

# Textbox to display found files
files_found = customtkinter.CTkTextbox(app, height=10)
files_found.grid(row=0, column=2, rowspan=10, columnspan=2, padx=20, pady=10, sticky="nsew")

# Configure grid columns to distribute space evenly
app.grid_columnconfigure(0, weight=1)
app.grid_columnconfigure(1, weight=1)
app.grid_columnconfigure(2, weight=2)  # Allocate more space to the files display
app.grid_columnconfigure(3, weight=2)
app.grid_rowconfigure(9, weight=1)  # Ensure the files display fills from top to bottom

# Run the application
app.mainloop()
