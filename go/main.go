//go:build js && wasm

package main

import (
	"syscall/js"

	"github.com/antlr4-go/antlr/v4"
	"github.com/tempo-lang/tempo/compiler"
	"github.com/tempo-lang/tempo/parser"
	"github.com/tempo-lang/tempo/type_check/type_error"
)

func compileWrapper() js.Func {
	jsonFunc := js.FuncOf(func(this js.Value, args []js.Value) any {
		if len(args) != 1 {
			return "Invalid no of arguments passed"
		}

		inputSource := args[0].String()

		inputStream := antlr.NewInputStream(inputSource)
		sourceOutput, errors := compiler.Compile(inputStream, nil)
		if errors != nil {
			errorOutput := []any{}
			for _, error := range errors {
				switch err := error.(type) {
				case *parser.SyntaxError:
					errorOutput = append(errorOutput, map[string]any{
						"error": err.Error(),
						"start": []any{err.Line(), err.Column()},
						"end":   []any{err.Line(), err.Column()},
					})
				case type_error.Error:
					rule := err.ParserRule()
					endTokenLength := rule.GetStop().GetStop() - rule.GetStop().GetStart()
					errorOutput = append(errorOutput, map[string]any{
						"error": err.Error(),
						"start": []any{rule.GetStart().GetLine(), rule.GetStart().GetColumn()},
						"end":   []any{rule.GetStop().GetLine(), rule.GetStop().GetColumn() + endTokenLength + 1},
					})
				default:
					errorOutput = append(errorOutput, map[string]any{
						"error": err.Error(),
					})
				}
			}
			return map[string]any{
				"errors": errorOutput,
				"output": nil,
			}
		}

		return map[string]any{
			"errors": []any{},
			"output": sourceOutput,
		}
	})

	return jsonFunc
}

func main() {
	global := map[string]any{}
	global["compile"] = compileWrapper()

	js.Global().Set("playground", global)
	<-make(chan struct{}) // keep runtime alive
}
