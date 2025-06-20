//go:build js && wasm

package main

import (
	"fmt"
	"strings"
	"syscall/js"
)

func compileWrapper() js.Func {
	jsonFunc := js.FuncOf(func(this js.Value, args []js.Value) any {
		if len(args) != 1 {
			return "Invalid no of arguments passed"
		}
		inputJSON := args[0].String()
		fmt.Printf("input %s\n", inputJSON)
		return strings.ToUpper(inputJSON)
	})

	return jsonFunc
}

func main() {
	global := map[string]any{}
	global["compile"] = compileWrapper()

	js.Global().Set("playground", global)
	<-make(chan struct{}) // keep runtime alive
}
