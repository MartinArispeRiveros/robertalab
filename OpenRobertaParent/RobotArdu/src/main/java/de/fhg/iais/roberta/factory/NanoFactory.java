package de.fhg.iais.roberta.factory;

import java.util.Properties;

public class NanoFactory extends AbstractArduinoFactory {

    public NanoFactory(String robotName, Properties robotProperties, String tempDirForUserProjects) {
        super(robotName, robotProperties, tempDirForUserProjects);
    }
}