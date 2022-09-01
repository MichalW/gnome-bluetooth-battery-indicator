all: build install

translation:
	xgettext --from-code=UTF-8 *.js --output=po/bluetooth-battery-indicator.pot

build:
	glib-compile-schemas ./schemas
	cp -R Bluetooth_Headset_Battery_Level .Bluetooth_Headset_Battery_Level
	rm -f Bluetooth_Headset_Battery_Level/.git Bluetooth_Headset_Battery_Level/.gitignore Bluetooth_Headset_Battery_Level/Dockerfile Bluetooth_Headset_Battery_Level/__init__.py

	mv AirStatus .AirStatus
	mkdir AirStatus
	cp .AirStatus/airstatus.py AirStatus/

	gnome-extensions pack -f \
		--extra-source=Bluetooth_Headset_Battery_Level \
		--extra-source=AirStatus \
		--extra-source=scripts/ \
		--extra-source=bluetooth.js	\
		--extra-source=constants.js	\
		--extra-source=indicator.js \
		--extra-source=LICENSE \
		--extra-source=README.md \
		--extra-source=settings.js \
		--extra-source=settingsWidget.js \
		--extra-source=utils.js \
		. \
		--out-dir=./

	rm -Rf Bluetooth_Headset_Battery_Level AirStatus
	mv .Bluetooth_Headset_Battery_Level Bluetooth_Headset_Battery_Level
	mv .AirStatus AirStatus
install:
	gnome-extensions install -f bluetooth-battery@michalw.github.com.shell-extension.zip

clean:
	rm -f schemas/gschemas.compiled
	rm -f bluetooth-battery@michalw.github.com.shell-extension.zip
