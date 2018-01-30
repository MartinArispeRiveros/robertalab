package de.fhg.iais.roberta.factory.mbed.calliope.calliope2017;

import de.fhg.iais.roberta.factory.mbed.calliope.AbstractFactory;
import de.fhg.iais.roberta.factory.mbed.calliope.CompilerWorkflow;
import de.fhg.iais.roberta.util.Util1;

public class Factory extends AbstractFactory {

    public Factory() {
        this.calliopeProperties = Util1.loadProperties("classpath:Calliope2017.properties");
        this.name = this.calliopeProperties.getProperty("robot.name");
        this.robotPropertyNumber = robertaProperties.getRobotNumberFromProperty(this.name);
        this.compilerWorkflow =
            new CompilerWorkflow(
                robertaProperties.getTempDirForUserProjects(),
                robertaProperties.getStringProperty("robot.plugin." + this.robotPropertyNumber + ".compiler.resources.dir"),
                robertaProperties.getStringProperty("robot.plugin." + this.robotPropertyNumber + ".compiler.dir"));

        addBlockTypesFromProperties("Calliope2017.properties", this.calliopeProperties);
    }

}
