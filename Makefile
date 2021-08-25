all: build install

translation:
	xgettext --from-code=UTF-8 *.js --output=po/bluetooth-battery-indicator.pot

build:
	glib-compile-schemas ./schemas
	gnome-extensions pack -f --extra-source=Bluetooth_Headset_Battery_Level/ --extra-source=bluetooth.js --extra-source=constants.js --extra-source=indicator.js --extra-source=LICENSE --extra-source=README.md --extra-source=settings.js --extra-source=settingsWidget.js --extra-source=utils.js . --out-dir=./

install:
	gnome-extensions install -f bluetooth-battery@michalw.github.com.shell-extension.zip

clean:
	rm -f schemas/gschemas.compiled
	rm -f bluetooth-battery@michalw.github.com.shell-extension.zip
