package main

import (
    "log"
    "flag"
    "fmt"
    "os"
    "net/http"
)

var quiet bool

const VERSION = "0.1"

/*
func Log(handler http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(logFile, "%s %s %s\n", r.RemoteAddr, r.Method, r.URL)
        handler.ServeHTTP(w, r)
    })
}
*/

func requestHandler(handler http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            if (!quiet) {
                fmt.Printf("%s %s %s\n", r.RemoteAddr, r.Method, r.URL)
            }
            handler.ServeHTTP(w, r)
    })
}

func main() {
    var iface   string
    var port    int
    var local   bool
    var version bool

    // -- Argument handling ---------------------------------------------
    flag.StringVar(&iface, "i",     "0.0.0.0", "Address to bind to")

    flag.IntVar(&port,     "p",            80, "Port to listen on")
    flag.IntVar(&port,     "port",         80, "Port to listen on")

    flag.BoolVar(&local,   "l",         false, "Bind to local address")
    flag.BoolVar(&local,   "local",     false, "Bind to local address")

    flag.BoolVar(&quiet,   "q",         false, "Quiet")
    flag.BoolVar(&quiet,   "quiet",     false, "Quiet")

    flag.BoolVar(&version, "v",         false, "Show version")
    flag.BoolVar(&version, "version",   false, "Show version")

    flag.Parse()

    if version {
        fmt.Printf("Webserv version %s\n", VERSION)
        os.Exit(0)
    }

    if local {
        iface="127.0.0.1"
    }
    // -- ---------------------------------------------------------------

    binding := fmt.Sprintf("%s:%d", iface, port)

    fs := http.FileServer(http.Dir("./"))
    http.Handle("/", fs)

    //log.Printf("Listening on %s...", binding)
    log.Printf("Webserv version %s - listening on %s\n", VERSION, binding)

    log.Fatal( http.ListenAndServe(binding, requestHandler(http.DefaultServeMux)))
}
