Create a complete, playable Sudoku game as an html file potentially with supporting files. 
Sudoku-specific Requirements:
* Playable when hosted through an iframe
* Standard grid of 9x9.
* Allow some mechanism to tag individual cells with 'tiny numbers'.
    * These are numbers that mean something to the user but are not validated by any game logic.
    * some way to clear all tiny numbers, clear just a row or column, clear a 9 cell square.
* A toggleable setting that will highlight incorrect numbers.
* Difficulty settings for easy, medium, hard.

Generic Gameplay
* Once a game has ended allow the user to start a new one or quit.
    * quitting takes the user to the game list page.
* Allow the user to pause and resume the game by pressing "P".
    * When the game is paused, blur the grid.
* Has simple blip/bloop style sound effects which can be muted.
* Include the keys and actions to the side in a short legend.
* Keep all new files in the same folder as the specs.
* Split the code into multiple files to help with file size and organization.
* The game should be playable on mobile and desktop devices.
* Try to keep function size small and focused on a specific task.
    * task-focused functions should make testing and debugging easier.

Questions:
* Is there a standard way to generate sudoku game starting positions?
* Is the generation method to completely fill a valid board and randomly remove some?
    * Or use some form of logic to remove some as 'randomly' might lead to multiple solutions.
