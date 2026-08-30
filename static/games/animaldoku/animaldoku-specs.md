# Goal

Catdoku (also known as Meowdoku) is a logic puzzle game combining Sudoku-style placement with Minesweeper-style deduction.

Following the rules, the player needs to deduce where the animals should be placed.  An incorrect placement costs a life.

# The environment

Summary: Django-hosted website that has a list of games with this being one of them.
Python: 3.14.3
Python Virtual Environment: pyenv set by `.python-version` in the project root.
Python binary: `~/.pyenv/versions/ai-simple-blog/bin/python`
Django: 6.1
Static files are stored in `static` folder.  Ignore the `public` folder as Django's `collectstatic` command will copy files from `static` to `public`.

# Animaldoku-specific requirements

* The play area is a 10x10 grid.
* At the start of the game, a number of animals (using cat in the rules but it could be any) are placed in their territories.
    * Start with 1 animal for now.  I need to figure out how to tell when a layout is logically solvable vs solvable only through a lucky guess.

## The Four Basic Rules
* One cat per colored region: Every distinct colored territory on the board must contain exactly one cat.
* One cat per row: Each horizontal row can only contain a single cat, regardless of colored territory.
* One cat per column: Each vertical column can only contain a single cat, regardless of colored territory.
* No touching cats: Two cats cannot touch each other horizontally, vertically, or diagonally.

## How to Play and Solve
* Tap once to place an X on a square where a cat cannot go.
    * Tapping once on an X will remove the X.
* Tap twice to place a cat in a confirmed square.
    * The taps are timed.  A quick double-tap, like a double-click from a mouse, needs to happen in a short time to be recognized as a double.
    * If a cat is placed incorrectly, the cat is removed and a life is lost.  If a life is lost, the game might be over.

## Toggleable features
* Placing a cat automatically blocks its entire row, column, and the eight surrounding adjacent squares.
    * "blocking" means placing an X in the squares.
    * This is a "helpful feature" in that it saves the player time.
    * This only applies to correctly placed animals.  If the animal is incorrectly placed, do not change any X placements.
    * Since this only applies to correctly placed animals, there is no case where this auto blocking would overwrite an animal.

## Grid generation
To ensure a valid puzzle, follow a Reverse-Generation Strategy: first place the solution (the animals) legally, and then grow the color regions around them using a flood-fill algorithm.
The manage command `game/management/commands/generate_animaldoku_grid.py` generates a grid using python.  Use that as an example on how to generate a grid or refactor its code into an api that the javascript can call.  If using an API endpoint, create that endpoint in the existing `game` app.

## Additional Details
* The player starts with 3 lives.
* Incorrect placement costs 1 life.
* Each level uses one type of animal but can use a variety of the variations of that animal.
    * The game decides the animal type and variation.
    * For an individual level, one variation is used.  The color territories use color-shifted versions of that variation.

## Level progression
* Levels are just individual grids.  At the moment, there isn't an easy/medium/hard values.
* There is no time limit.
* Lives are assigned at the start of the game.  The player does not get a refill between levels.
* Levels are generated until the player loses or quits.
* A level is complete when all color territories contain one animal as satisfy `The Four Basic Rules` from above.
    * The player is not required to fill the non-animal cells with X's.

# Supporting images
* Generate small icons for a few animals.  Cat, Dog, Horse, Mouse, Duck, Parrot, and Fish.
    * Generate a few variations of each animal for variety.
    * The images should just be the head of the animal
    * The style should be simple cartoon.  These images will be physically small so cannot have a lot of detail.
    * The image will be color-shifted in some manner during gameplay so the image somewhat matches the animal's color territory.  This is so we don't have to have many different images which only differ on a color shift.

# Generic Gameplay
* Once a game has ended allow the user to start a new one or quit.
    * quitting takes the user to the game list page.
* Allow the user to pause and resume the game by pressing "P".
    * When the game is paused, blur the grid.
* Has simple blip/bloop style sound effects which can be muted.
* Include the keys and actions to the side in a short legend.
* Keep all files in the same folder as the specs.
* Split the code into multiple files to help with file size and organization.
* The game should be playable on mobile and desktop devices.
* Try to keep function size small and focused on a specific task.
    * task-focused functions should make testing and debugging easier.
