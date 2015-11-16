package de.fhg.iais.roberta.usb;

import java.awt.Color;
import java.awt.Font;
import java.util.Locale;
import java.util.ResourceBundle;
import java.util.logging.ConsoleHandler;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.swing.SwingUtilities;
import javax.swing.UIManager;

import de.fhg.iais.roberta.connection.USBConnector;
import de.fhg.iais.roberta.ui.ConnectionView;
import de.fhg.iais.roberta.ui.UIController;
import de.fhg.iais.roberta.util.ORAFormatter;

public class Main {

    private static Logger log = Logger.getLogger("Connector");
    private static ConsoleHandler handler = new ConsoleHandler();

    public static void main(String[] args) {

        configureLogger();

        SwingUtilities.invokeLater(new Runnable() {
            @Override
            public void run() {
                prepareUI();
                ResourceBundle messages = getLocals();
                ResourceBundle serverProps = getServerProps();
                USBConnector usbCon = new USBConnector(serverProps);
                ConnectionView view = new ConnectionView(messages);
                UIController<?> controller = new UIController<Object>(usbCon, view, messages);
                controller.control();
                Thread thread = new Thread(usbCon, "USBConnector");
                thread.start();
            }

            private void prepareUI() {
                try {
                    UIManager.setLookAndFeel(UIManager.getCrossPlatformLookAndFeelClassName());
                } catch ( Exception e ) {
                    e.printStackTrace();
                }
                UIManager.put("MenuBar.background", Color.white);
                UIManager.put("Menu.background", Color.white);
                UIManager.put("Menu.selectionBackground", Color.decode("#afca04"));
                UIManager.put("MenuItem.background", Color.white);
                UIManager.put("MenuItem.selectionBackground", Color.decode("#afca04"));
                UIManager.put("MenuItem.focus", Color.decode("#afca04"));
                UIManager.put("Menu.foreground", Color.decode("#333333"));
                UIManager.put("Menu.Item.foreground", Color.decode("#333333"));
                UIManager.put("Menu.font", new Font("Arial", Font.PLAIN, 12));
                UIManager.put("MenuItem.foreground", Color.decode("#333333"));
                UIManager.put("MenuItem.font", new Font("Arial", Font.PLAIN, 12));
            }

            private ResourceBundle getServerProps() {
                return ResourceBundle.getBundle("OpenRobertaUSB");
            }

            private ResourceBundle getLocals() {
                ResourceBundle rb;
                try {
                    rb = ResourceBundle.getBundle("messages", Locale.getDefault());
                } catch ( Exception e ) {
                    rb = ResourceBundle.getBundle("messages", Locale.ENGLISH);
                }
                log.config("Language " + rb.getLocale());
                return rb;
            }
        });
    }

    private static void configureLogger() {
        handler.setFormatter(new ORAFormatter());
        handler.setLevel(Level.ALL);
        log.setUseParentHandlers(false);
        log.setLevel(Level.ALL);
        log.addHandler(handler);
    }
}
