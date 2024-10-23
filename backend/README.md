To run the backend, execute:
`go run .` or `air .` for live reloading

To kill all processes running on port `8080`:
`lsof -i tcp:8080 | awk 'NR!=1 {print $2}' | xargs kill`