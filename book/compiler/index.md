# Index

### createCompiler

```javascript

// `createCompilerCreator` allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.
export const createCompiler = createCompilerCreator(function baseCompile (
  template: string,
  options: CompilerOptions
): CompiledResult {
  // 这一块大家都知道啦  之前的编译部分  生成了对应的ast语法树
  const ast = parse(template.trim(), options)
  if (options.optimize !== false) {
    optimize(ast, options) // 优化部分 如果是静态节点 打上静态节点标记
  }
  // 生成代码块
  const code = generate(ast, options)
  return {
    ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns // 如果是静态节点  会有静态节点渲染数组
  }
})


```