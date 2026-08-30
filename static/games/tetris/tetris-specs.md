# Goal

Create a complete, playable Tetris game starting from an html file named `tetris.html`. 

# The environment

Summary: Django-hosted website that has a list of games with this being one of them.
Python: 3.14.3
Python Virtual Environment: pyenv set by `.python-version` in the project root.
Python binary: `~/.pyenv/versions/ai-simple-blog/bin/python`
Django: 6.1
Static files are stored in `static` folder.  Ignore the `public` folder as Django's `collectstatic` command will copy files from `static` to `public`.

# Tetris-specific requirements

* playing grid of 10 columns and 20 rows
* use the standard tetris piece shapes of I, J, L, O, S, T, Z
* prevent pieces from clipping outside the grid or into existing peices
* use the arrow keys for piece movement with up being rotate and down being a single line drop, "soft drop"
* when the spacebar is pressed, drop the current piece without waiting.
    * Perhaps a very minor delay for the drop animation so the user can see the piece drop rather than it just appearing at the bottom.
* keep score for successfully placed pieces with a value of 1 for each cell of the newly placed piece
* when a horizontal line is completed
    * remove the completed line(s) and move all cells above the lines down to fill the cleared lines.
    * add a bonus score of 100 for 1 line, 200 for 2 lines, 400 for 3 lines, and 800 for 4 lines
* use 7 different colors for the pieces.  Pick a random color for each new piece. Use cheerful colors.
* allow the initial speed of the piece dropping to be configured as a variable in the script.
* end the game when the new piece cannot be added to the grid without overlapping an existing cell or being outside the grid.
* Starting a new game is done by clicking one of two buttons.
    * The options are "new timed game" or "new game"
    * The difference is in how levels increase.  See a later bullet point for that information.
* The "new timed game" and "new game" switch how levels increase
    * "new timed game" - increase level every 2 minutes of gameplay (not including paused time)
    * "new game" - increase level every 1000 points
* the drop speed increases with level
* Use a ghost piece to show where the current piece would land.
* include a "Next piece" preview

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
