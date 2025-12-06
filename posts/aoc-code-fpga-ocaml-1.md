---
title: Working on AOC and Advent of FPGA??!!! OCAML??? Part 1
layout: post
date: 2025-12-04T13:37:53.328Z
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

Day 2 was much easier than day 1, very straight forward solution. I had a little trouble with the types, but the langauge features, especially how it infers the type dynamically is very sweet. Also, the inline hints I get from the LSP are super helpful, kinda like how rust-analyzer gives.

```ocaml
let pattern_of pattern len =
  let patstr = string_of_int pattern in
  let pat_len = String.length patstr in
  if pat_len < 1 then None
  else if len mod pat_len <> 0 then None
  else
    let rec gen acc len_rem =
      if len_rem > 0 then gen (acc ^ patstr) (len_rem - pat_len) else acc
    in
    Some (gen "" len)

let validate_2 num =
  let str = string_of_int num in
  let len = String.length str in
  let rec comp idx =
    if idx > len / 2 then 0
    else
      let new_acc = String.sub str 0 idx in
      let res = pattern_of (int_of_string new_acc) len in
      match res with
      | Some pattern -> if pattern = str then num else comp (idx + 1)
      | _ -> comp (idx + 1)
  in
  comp 1

let parse_range func a b =
  let rec iter_range acc inum =
    if inum > b then acc else iter_range (acc + func inum) (inum + 1)
  in
  iter_range 0 a

let parse_input func arr =
  let rec iter_input acc inp =
    match inp with
    | [] -> acc
    | (a, b) :: res -> iter_input (acc + parse_range func a b) res
  in
  iter_input 0 arr

let day2_part2 inp = parse_input validate_2 inp
```

Some salient language things I like:

- The `in` thingy. I love how everything is supposed to converge to a context. I think this encourages a lot of thinking on the developer's part instead of just randomly defining stuff anywhere.
- `match` one can never go wrong with pattern matching. Or they can go wrong but the compiler will tell you to cover all those cases. Again, making developer think before they write a very terrible if else if ladder.
- Tail recursion is sweet. I had first checked it out in erlang, and therefore it was not an alien concept this time.
- UTop is great! I write small helper functions and test them out on utop all the time!

However now it's time to think what creative thing can be done for Advent of FPGA.... recreating the same designs again in HDL isn't going to be that fun.... maybe a general computer which can solve all the problems using a custom programming language like a coprocessor like PRU, which have their own instruction set and can be programmed in a high-level language.

Let me see... I think I should commit this post for now. You can find all the solutions in my git repo [here](https://github.com/SuperChamp234/aoc-2025.git)!

See you in the next post!