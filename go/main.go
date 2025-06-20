//go:build js && wasm

package main

import (
	"syscall/js"

	"github.com/antlr4-go/antlr/v4"
	"github.com/tempo-lang/tempo/compiler"
)

func compileWrapper() js.Func {
	jsonFunc := js.FuncOf(func(this js.Value, args []js.Value) any {
		if len(args) != 1 {
			return "Invalid no of arguments passed"
		}

		inputSource := args[0].String()

		inputStream := antlr.NewInputStream(inputSource)
		output, err := compiler.Compile(inputStream, nil)
		if err != nil {
			return "compiler errors"
		}

		return output
	})

	return jsonFunc
}

func main() {
	global := map[string]any{}
	global["compile"] = compileWrapper()

	js.Global().Set("playground", global)
	<-make(chan struct{}) // keep runtime alive
}
