package main

import (
	"context"
	"log"
	"net/http"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"server/internal/server"
)

func gracefulShutdown(done chan bool) {
	// Create context that listens for the interrupt signal from the OS.
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	// Listen for the interrupt signal.
	<-ctx.Done()

	log.Println("received shutdown signal, initiating graceful shutdown...")
	log.Println("press Ctrl+C again to force immediate shutdown")

	stop() // Allow Ctrl+C to force shutdown

	log.Println("server shutdown complete")

	// Notify the main goroutine that the shutdown is complete
	done <- true
}

func main() {
	startTime := time.Now()
	log.Println("starting sampha API...")

	server := server.NewServer()

	// Create a done channel to signal when the shutdown is complete
	done := make(chan bool, 1)

	// Run graceful shutdown in a separate goroutine
	go gracefulShutdown(done)

	initDuration := time.Since(startTime)
	log.Printf("server initialization completed in %v", initDuration)
	log.Println("=" + strings.Repeat("=", 60))

	err := server.ListenAndServe()
	log.Println("HTTP server is ready to accept connections")
	if err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %s", err)
	}

	// Wait for the graceful shutdown to complete
	<-done
	totalUptime := time.Since(startTime)
	log.Printf("total server uptime: %v", totalUptime)
	log.Println("graceful shutdown complete.")
}
