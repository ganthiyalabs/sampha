package server

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"path"
	"strings"
)

//go:embed static/index.html static/.keep static/assets/*
var staticFiles embed.FS

// StaticHandler serves embedded static files
func (s *Server) StaticHandler() http.Handler {
	// Create a sub-filesystem rooted at "static" so paths are resolved correctly
	staticFS, err := fs.Sub(staticFiles, "static")
	if err != nil {
		log.Fatalf("statichandler: Unable to create sub filesystem: %v", err)
	}

	// Create a file server that serves from the embedded static filesystem
	fileServer := http.FileServer(http.FS(staticFS))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get the requested path
		reqPath := r.URL.Path

		// Determine which file to serve
		var requestedFile string
		if reqPath == "/" {
			// Serve index.html directly to avoid FileServer directory redirects
			requestedFile = "index.html"
			data, err := fs.ReadFile(staticFS, requestedFile)
			if err != nil {
				log.Printf("StaticHandler: Failed to read index.html: %v", err)
				http.Error(w, "index.html not found", http.StatusNotFound)
				return
			}
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
			if _, err := w.Write(data); err != nil {
				log.Printf("StaticHandler: Failed to write index.html: %v", err)
			}
			return
		} else {
			// Clean the path and prevent path traversal
			cleaned := path.Clean("/" + strings.TrimPrefix(reqPath, "/"))
			requestedFile = strings.TrimPrefix(cleaned, "/")
		}

		// Try to open the file in the embedded static filesystem
		file, err := staticFS.Open(requestedFile)
		if err != nil {
			// If file doesn't exist: for asset-like paths (with an extension), return 404.
			// Otherwise, serve index.html for SPA client-side routes.
			if strings.Contains(requestedFile, ".") {
				http.NotFound(w, r)
				return
			}
			data, err := fs.ReadFile(staticFS, "index.html")
			if err != nil {
				log.Printf("StaticHandler: Failed to read index.html for SPA fallback: %v", err)
				http.NotFound(w, r)
				return
			}
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
			if _, err := w.Write(data); err != nil {
				log.Printf("StaticHandler: Failed to write index.html (SPA fallback): %v", err)
			}
			return
		} else {
			// If it's a directory, ensure trailing slash to avoid redirect loops
			if info, err := file.Stat(); err == nil && info.IsDir() {
				// Let FileServer handle the redirection, but make Location absolute
				if !strings.HasSuffix(r.URL.Path, "/") {
					http.Redirect(w, r, r.URL.Path+"/", http.StatusMovedPermanently)
					_ = file.Close()
					return
				}
			}
			file.Close()
		}

		// Create a new request with the correct path for the file server
		newReq := *r
		newReq.URL.Path = "/" + requestedFile

		// Set caching headers: long cache for assets, no-cache for index.html
		if requestedFile == "index.html" {
			w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		} else {
			// One year cache with immutable for versioned assets
			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		}

		// Serve the file using the file server
		fileServer.ServeHTTP(w, &newReq)
	})
}
