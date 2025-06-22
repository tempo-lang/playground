
public/playground.wasm: ./go/main.go go.mod go.sum
	GOOS=js GOARCH=wasm go build -o ./public/playground.wasm ./go
