class GameState:

    def __init__(self):

        self.width = 800
        self.height = 800

        self.ball_x = 400
        self.ball_y = 400

        self.ball_vx = 5
        self.ball_vy = 4

        self.paddles = {

            "TOP": 350,
            "BOTTOM": 350,

            "LEFT": 350,
            "RIGHT": 350
        }

        self.scores = {

            "TOP": 3,
            "RIGHT": 3,
            "BOTTOM": 3,
            "LEFT": 3
        }

        self.started = False