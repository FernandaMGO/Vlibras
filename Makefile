install:
	@read -p "Você deseja instalar o módulo Forever? (y/n) " choice; \
	if [ "$$choice" = "y" ]; then \
	  sudo npm install -g forever; \
	  npm install; \
	else \
	  npm install; \
	fi

run:
	@forever start server.js

stop:
	@forever stop server.js

list:
	@forever list

clean:
	@rm text_files/* 
	@rm videos/*
	@rm -r uploads/* 
