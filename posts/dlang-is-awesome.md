---
title: D Language is Awesome!
layout: post
date: 2025-12-08T14:37:53.328Z
tags:
  - blog
  - dlang
---

For the past few weeks, I've been getting used to this new language featured at my workplace: D! At first I was quite skeptical to see this company use such an obscure language for everyday software, but now that I've gotten some time to explore all the features this lang has to offer, I feel sort of ashamed lol.

Hence, I decided to write a small post showcasing some of its features, in the hopes that others can have a look at this language and maybe get into it!

# What wow-ed me?

D was supposed to be the successor to Cpp, however it never caught popularity. It boasts many features, including stuff like gradual memory safety (unlike Rust's all or nothing approach), but the one which caught my eye was compile time function execution, and mixins!

# CTFE - Compile Time Function Execution

Compile Time Function Execution (CTFE) is a feature that had me very excited once I tried it! In most languages, there's a clear boundary between "compile-time" and "run-time". However, in D, that boundary is intentionally blurred. Any normal D function can run at compile time as long as it doesn't do forbidden operations.

This means you can generate lookup tables at compile time, validate them, parse configs files before your binary is built, or generate many many constants for use at compile time! 

```d
// in D
int[] generateSquares(size_t n) {
    int[] arr;
    foreach (i; 0 .. n)
        arr ~= i * i;
    return arr;
}

enum squares = generateSquares(10); // Executes fully at compile time!

void main() {
    writeln(squares); // [0, 1, 4, 9, ...]
}

// parsing JSON during compile time!
import std.json;

enum config = parseJSON(q{
{
    "port": 8080,
    "debug": true,
    "app_name": "myapp"
}
});

void main() {
    writeln(config["app_name"]); // myapp
}
```

In Cpp, we have `constexpr`, however it's nowhere close to what we can do in D. D's CTFE allows for much more complex computations and even file I/O at compile time, making it a powerful tool for metaprogramming and code generation.

# Templates

Cpp boasts SFINAE (“Substitution Failure Is Not An Error”), where it tries to hack the language to make sure template constraints work. However, it's a very advanced concept simply because its really hard for developers to intuitively write readable code and debug that easily as the codebase evolves. Cpp 20 has solved some of these things, but D has already thought of this!

For templates, D provides normal if-style constraints for types, allows for compile time analysis using `__traits`, and produces intuitive compile time errors to make it easy for debugging.

```d
//in D
T square(T)(T x)
    if (isNumeric!T)
{
    return x * x;
}

square(10);     // ok
square("hey");  // clean, understandable error
```

# Mixins

Finally, my favourite feature: Mixins!!

Programming often involves writing repetitive boilerplate like getters, setters, serializers, registration tables, reflection-based utilities, etc. In D, mixins let you generate this code at compile time, using actual compile-time knowledge of your types. The generated code is fully type-checked, scoped, and validated by the compiler. This makes it possible to write highly generic and reusable code while maintaining type safety and performance.

## A simple mixin example!

```d
mixin("int y = x * 2;"); // wow we can "write code" at compile time

mixin("int arr[" ~ n.stringof ~ "];"); // hehe imagine what else we can do
```

Let's have a look at something more complex: 

## Auto‑generate a JSON serializer

```d
import std.traits;
import std.json;
import std.conv;

mixin template AutoToJson(T)
{
    string code = "JSONValue toJson() const {
    JSONValue obj = JSONValue.init;
    obj.object = JSONValue[string]();
";

    foreach (field; FieldNameTuple!T)
    {
        code ~= "    obj.object[\"" ~ field ~ "\"] = to!string(this." ~ field ~ ");
";
    }

    code ~= "    return obj;
}";

    mixin(code);
}

struct Person
{
    string name;
    int age;
    double height;

    mixin AutoToJson!Person; // generates toJson() for us!
}

void main()
{
    auto p = Person("Zain", 25, 5.8);
    writeln(p.toJson());
}
```

With that one `mixin AutoToJson!Person;`, D generates an entire JSON serializer automatically. You can clearly see how much code we didn't have to "write"!

This pattern extends to stuff like auto-registering components, generating REST bindings, or generating boilerplate UVM-style verification components with just a simple YAML file (which is what I do at my workplace)

In Cpp, you either write all of this manually, or use a program which writes a program file, yes which sounds like a hack. I read somewhere that Cpp 26 is looking to address some of this, but yet to see it in action somewhere.

# My Work

I use D in the most wild setting possible, a domain specific language! The tools D provides for working with the code itself makes me wanna wake up every morning and replace each file's repetitive code with mixins! Nowadays I think I've stumbled onto a pavlov like response when I see repetitive code, mixins smell like blueberries. 

# How can you start with D?

Getting started with D is actually much simpler than most people expect. The tooling is modern, the compiler is fast, and the package manager (Dub) makes project setup basically frictionless.

For a compiler, the most common choices are DMD, the reference compiler, and LDC2, which is an LLVM based D compiler

You can install them from https://dlang.org/download.html.

Or, you can use Dub! Dub is like Cargo for Rust or npm for JS, but way simpler to use. It handles stuff like scaffolding, dependencies and build configs. There's also an online sandbox which you can try at https://run.dlang.io

To learn D, the best starting point is https://tour.dlang.org. There's also a small community somewhere on reddit and discord! 