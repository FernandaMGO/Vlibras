install:
	@read -p "Você deseja instalar o módulo Forever? (y/n) " choice; \
	if [ "$$choice" = "y" ]; then \
	  sudo npm install -g forever; \
	  npm install; \
	  ln -s $$HOME vlibras_user \
	else \
	  ln -s $$HOME vlibras_user \
	  npm install; \
	fi

sym_link:
	@ln -s $$HOME vlibras_user

run:
	@forever start server.js

node: clean
	@node server.js

stop: clean
	@forever stop server.js

list:
	@forever list

clean:
	@rm -f text_files/* 
	@rm -f videos/*
	@rm -rf uploads/* 
