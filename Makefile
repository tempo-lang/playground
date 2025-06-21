
public/playground.wasm: ./go/main.go
	GOOS=js GOARCH=wasm go build -o ./public/playground.wasm ./go
