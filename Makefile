all: build install

translation:
	xgettext --from-code=UTF-8 *.js --output=po/hyperx-battery-indicator.pot
	for f in po/*.po; do \
		msgmerge --update --backup=off $$f po/hyperx-battery-indicator.pot; \
	done
	
build:
	glib-compile-schemas ./schemas
	gnome-extensions pack -f --extra-source=scripts/ --extra-source=UPowerController.js	--extra-source=constants.js	--extra-source=indicator.js --extra-source=LICENSE --extra-source=README.md --extra-source=settings.js --extra-source=settingsWidget.js --extra-source=utils.js . --out-dir=./

install:
	gnome-extensions install -f hyperx-battery@deividgermano.github.com.shell-extension.zip

clean:
	rm -f schemas/gschemas.compiled
	rm -f hyperx-battery@deividgermano.github.com.shell-extension.zip
