---
title: Working on AOC and Advent of FPGA??!!! OCAML??? Part 1
layout: post
date: 2025-12-04T12:37:53.328Z
tags:
  - blog
  - aoc
  - fpga
  - ocaml
---

I stumbled across this [blog post by Jane Street](https://blog.janestreet.com/advent-of-fpga-challenge-2025/), which talks about an Advent of FPGA challenge hosted by Jane Street. 

> This year, we’re inviting the community to join us in that spirit with the 2025 Advent of FPGA Challenge. When the final AoC 2025 puzzle drops, pick any puzzles you like (at least one and up to as many as you want) to build synthesizable RTL with realistic I/O, bonus points if you do it in Hardcaml. We’re excited to see the clever designs created across the academic and open‑source communities, and we’d also love to get more people trying Hardcaml!

Well well well, that sounds like a challenge from the big minds at money making corp. I'm not sure I can keep up with that, but I'll give it a try. I've never used OCaml or Hardcaml before, so lets see how that goes lol. I'll use this blog to kinda give live devel updates.

I already started and finished day 1 before finding this blog (in rust), so time to port the solution to OCaml.... First thing to do is to go through all the getting started for OCaml...

### OCaml initial impression

> Since let … = … in … is an expression, it can be used within another expression in order to have several values with their own names:

```ocaml
# let a = 1 in
  let b = 2 in
    a + b;;
- : int = 3
```

Ooh I can already smell the functionallishhness of the language.

### AOC Day 1 and 2

After fighting with the `utop` iteractive executor for a while, I feel exactly how I feel about other functional languages. They are either very well thought out, or maybe they are here to just make my life hard haha. Anyways, the learn section of the website also teaches how to read a file, and extract lines of of it. It didn't take me long to get the first day 1's part 1 working.

```ocaml
let pos_mod a b = ((a mod b) + b) mod b

let operate_on_dial dial opt num =
  match opt with
  | 'L' -> pos_mod (dial - num + 100) 100
  | 'R' -> pos_mod (dial + num) 100
  | _ -> failwith "unexpected operation on dial"

let day1_part_1 lines dial =
  let rec process_list acc dial lines =
    match lines with
    | [ "" ] -> acc
    | [] -> acc
    | elem :: rem ->
        let opt = elem.[0] in
        let num = int_of_string (String.sub elem 1 (String.length elem - 1)) in
        let new_dial = operate_on_dial dial opt num in
        if new_dial = 0 then process_list (acc + 1) new_dial rem
        else process_list acc new_dial rem
  in
  process_list 0 dial lines
```

I will upload all solutions on a git somewhere, but this small example gave me quite an introspection in how things are going to be....

Day 2 was much easier than day 1, very straight forward solution. However now it's time to think what creative thing can be done for Advent of FPGA.... recreating the same designs again in HDL isn't going to be that fun.... maybe a general computer which can solve all the problems using a custom programming language like a coprocessor like PRU, which have their own instruction set and can be programmed in a high-level language.

Let me see... I think I should commit this post for now. See you in the next post!