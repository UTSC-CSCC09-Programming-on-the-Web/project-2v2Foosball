# 2v2 Foosball

Deployment: <https://foosball.games>

### Team Members:

| Name         | Email                         | UTORID   |
| ------------ | ----------------------------- | -------- |
| Yong Le He   | yongle.he@mail.utoronto.ca    | heyong4  |
| Aydin Parekh | aydin.parekh@mail.utoronto.ca | parekhay |
| Emin Guliyev | emin.guliyev@mail.utoronto.ca | guliyeve |

## Brief Description

A 2v2 game game of foos-ball where players can join games and play against each other in real-time. In order to play, users must join a queue to be matched with other players. Once enough players are available, a game is created and players are put into a game room where they can play against each other. Players can also spectate games with a delay of 5 seconds, allowing them to watch the game without affecting the real-time gameplay. Additionally, players are able to re-watch the games that they have played in the past.

### Frontend Framework

Angular

### Addition Requirement

Real-time. Matches will be real-time and orchestrated through websockets.

---

## User Flow

1. Users login via Google and pay with Stripe.
2. Users are given a dashboard of existing games happening, along with a "play" button to join a new game.
3. Player's can choose to click on one of the games to spectate the game with a 5s delay.
4. They can also choose to create a new game, where they will be put into a queue until enough players are available to start the game.
5. After the game, user's can rewatch the games that they have played in the past.

## Core Technical Challenge

### Spectating with Delay and Rewatch

- We would need a way to allow users to spectate games with a delay, which requires us to implement a system that can handle real-time data and provide a delayed view of the game state. Our current idea is:
  - Players are put in a websocket room and the real-time events are broadcasted to them, but also saved
  - Spectators are in another room, and the saved events from the websocket room are sent to them with a delay
- The "video" has to be generated from a series of game events.

### Connection Issues

- We will have to address all the issues that come with connection issues, such as:
  - Players disconnecting mid-game -> what should happen to the game state
  - Players reconnecting mid-game -> how to put them back into the same game and have all its state restored
    - Delta updates are provided when a user is in game, so if they reconnect, we need to send the entire game state, not just a delta
  - Players having poor connections -> how to handle lag and ensure a smooth experience for all players

---

## Project Phases

### Alpha Milestone (CRUD)

- User login with OAuth2 and Stripe payment integration
- Matching queue system for players
- Playing the game in real-time

### Beta Milestone (Webhook System)

- Handling player disconnections and reconnections
- Spectating games with a 5 second delay
- Allow basic rewatching of past games (no controls)

### Final Milestone (Polish & Production Readiness)

- Implement controls for rewatching past games (play, pause, rewind)
- Finalizing the user interface and user experience
- Docker containerization and deployment
