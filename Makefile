install:
	@npm install
	@sudo npm install -g forever

run:
	@forever start server.js

stop:
	@forever stop server.js

list:
	@forever list
