package server

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"
)

func (s *Server) RegisterRoutes() http.Handler {
	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("/api/", s.apiHandler)

	// Serve static files for all other routes
	mux.Handle("/", s.StaticHandler())
	log.Println("api routes & static file handler registered")
	log.Println("available endpoints:")
	log.Println("   • GET  /api/health     - health check")
	log.Println("   • GET  /               - web interface")

	// Wrap the mux with CORS middleware
	return s.corsMiddleware(mux)
}

func (s *Server) corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		startTime := time.Now()

		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*") // Replace "*" with specific origins if needed
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, X-CSRF-Token")
		w.Header().Set("Access-Control-Allow-Credentials", "false") // Set to "true" if credentials are required

		// Handle preflight OPTIONS requests
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			log.Printf("cors: OPTIONS preflight request from %s - %v", r.RemoteAddr, time.Since(startTime))
			return
		}

		// Log the request
		log.Printf("request: %s %s from %s", r.Method, r.URL.Path, r.RemoteAddr)

		// Proceed with the next handler
		next.ServeHTTP(w, r)

		// Log response time
		duration := time.Since(startTime)
		log.Printf("response: %s %s completed in %v", r.Method, r.URL.Path, duration)
	})
}

func (s *Server) apiHandler(w http.ResponseWriter, r *http.Request) {
	// Route API requests based on path
	path := strings.TrimPrefix(r.URL.Path, "/api")

	log.Printf("routing request to %s", path)

	switch path {
	case "/":
		log.Println("handling hello world request")
		s.HelloWorldHandler(w, r)
	default:
		log.Printf("unknown endpoint requested: %s", path)
		http.NotFound(w, r)
	}
}

func (s *Server) HelloWorldHandler(w http.ResponseWriter, r *http.Request) {
	resp := map[string]string{"message": "sampha API is running"}
	jsonResp, err := json.Marshal(resp)
	if err != nil {
		http.Error(w, "failed to marshal response", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if _, err := w.Write(jsonResp); err != nil {
		log.Printf("failed to write response: %v", err)
	}
}
