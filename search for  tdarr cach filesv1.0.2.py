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

# Function to open directory selection dialog
def select_directory():
    directory = filedialog.askdirectory()
    if directory:  # Check if a directory was selected
        directory_label.configure(text=f"Selected: {directory}")
        app.selected_directory = directory  # Store selected directory for use in search
        # Reset the search button and disable the remove button
        search_button.configure(text="Search", state=tkinter.NORMAL)
        remove_button.configure(state=tkinter.DISABLED)

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
default_extensions = ""
extension_entry = customtkinter.CTkEntry(app, placeholder_text=default_extensions)
extension_entry.grid(row=3, column=0, columnspan=1, padx=20, pady=10, sticky="ew")

# Search description label
search_description = customtkinter.CTkLabel(app, text="This will search the directory specified above for any files containing 'TdarrCacheFile' in the filename.")
search_description.grid(row=4, column=0, columnspan=2, padx=20, pady=10, sticky="w")

# List to store found files
found_files = []

# Function to search for files based on filenames and extensions
def search_directory(directory=None):
    if directory is None:
        directory = app.selected_directory
    
    files_found.configure(state='normal')
    files_found.delete('1.0', tkinter.END)
    found_files.clear()
    
    # Extensions to skip regardless of user input
    fixed_extensions_to_skip = ['.DS_Store', '.ignore']
    
    # Extensions to skip based on user input
    extensions_to_skip = extension_entry.get().replace(' ', '').split(',')
    extensions_to_skip = [ext.strip() for ext in extensions_to_skip if ext]
    
    # Combine both sets of extensions to skip
    extensions_to_skip.extend(fixed_extensions_to_skip)

    for root, dirs, files in os.walk(directory):
        if not any((featurettes_var.get(), fanart_var.get())):
            dirs[:] = [d for d in dirs if not d.startswith('.') and not d.lower() == 'featurettes' and not d.lower() == 'fanart']
        elif featurettes_var.get():
            dirs[:] = [d for d in dirs if not d.startswith('.') and not d.lower() == 'featurettes']
        elif fanart_var.get():
            dirs[:] = [d for d in dirs if not d.startswith('.') and not d.lower() == 'fanart']

        for file in files:
            file_path = os.path.join(root, file)
            file_name, file_ext = os.path.splitext(file)
            if 'TdarrCacheFile' in file_path and file_ext[1:] not in extensions_to_skip:
                files_found.insert(tkinter.END, f"Found file: {file_path}\n", 'highlight')
                found_files.append(file_path)
    
    files_found.configure(state='disabled')
    search_button.configure(text="Search Complete", state=tkinter.DISABLED)
    remove_button.configure(state=tkinter.NORMAL)

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

# Textbox to display found files
files_found = customtkinter.CTkTextbox(app, height=10)
files_found.grid(row=0, column=2, rowspan=9, columnspan=2, padx=20, pady=10, sticky="nsew")

# Configure grid columns to distribute space evenly
app.grid_columnconfigure(0, weight=1)
app.grid_columnconfigure(1, weight=1)
app.grid_columnconfigure(2, weight=2)  # Allocate more space to the files display
app.grid_columnconfigure(3, weight=2)
app.grid_rowconfigure(8, weight=1)  # Ensure the files display fills from top to bottom

# Set default extensions in the entry widget at app startup
extension_entry.insert(0, default_extensions)

# Run the application
app.mainloop()
