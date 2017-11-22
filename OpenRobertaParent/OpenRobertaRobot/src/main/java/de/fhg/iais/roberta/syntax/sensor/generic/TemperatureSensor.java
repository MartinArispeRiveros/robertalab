package de.fhg.iais.roberta.syntax.sensor.generic;

import de.fhg.iais.roberta.blockly.generated.Block;
import de.fhg.iais.roberta.factory.IRobotFactory;
import de.fhg.iais.roberta.inter.mode.sensor.ISensorPort;
import de.fhg.iais.roberta.inter.mode.sensor.ITemperatureSensorMode;
import de.fhg.iais.roberta.syntax.BlockTypeContainer;
import de.fhg.iais.roberta.syntax.BlocklyBlockProperties;
import de.fhg.iais.roberta.syntax.BlocklyComment;
import de.fhg.iais.roberta.syntax.Phrase;
import de.fhg.iais.roberta.syntax.sensor.ExternalSensor;
import de.fhg.iais.roberta.syntax.sensor.SensorMetaDataBean;
import de.fhg.iais.roberta.transformer.Jaxb2AstTransformer;
import de.fhg.iais.roberta.visitor.AstVisitor;
import de.fhg.iais.roberta.visitor.sensor.AstSensorsVisitor;

/**
 * This class represents the <b>mbedSensors_temperature_getSample</b> blocks from Blockly into the AST (abstract syntax tree). Object from this class will
 * generate
 * code for checking if the sensor is pressed.<br/>
 * <br>
 * <br>
 * To create an instance from this class use the method {@link #make(BlocklyBlockProperties, BlocklyComment)}.<br>
 */
public class TemperatureSensor<V> extends ExternalSensor<V> {

    private TemperatureSensor(ITemperatureSensorMode mode, ISensorPort port, BlocklyBlockProperties properties, BlocklyComment comment) {
        super(mode, port, BlockTypeContainer.getByName("TEMP_SENSING"), properties, comment);
        setReadOnly();
    }

    /**
     * Create object of the class {@link TemperatureSensor}.
     *
     * @param properties of the block (see {@link BlocklyBlockProperties}),
     * @param comment added from the user,
     * @return read only object of {@link TemperatureSensor}
     */
    public static <V> TemperatureSensor<V> make(ITemperatureSensorMode mode, ISensorPort port, BlocklyBlockProperties properties, BlocklyComment comment) {
        return new TemperatureSensor<V>(mode, port, properties, comment);
    }

    @Override
    public String toString() {
        return "TemperatureSensor [" + getMode() + ", " + this.getPort() + "]";
    }

    @Override
    protected V accept(AstVisitor<V> visitor) {
        return ((AstSensorsVisitor<V>) visitor).visitTemperatureSensor(this);
    }

    /**
     * Transformation from JAXB object to corresponding AST object.
     *
     * @param block for transformation
     * @param helper class for making the transformation
     * @return corresponding AST object
     */
    public static <V> Phrase<V> jaxbToAst(Block block, Jaxb2AstTransformer<V> helper) {
        IRobotFactory factory = helper.getModeFactory();
        SensorMetaDataBean sensorData = extractPortAndMode(block, helper);
        String mode = sensorData.getMode();
        String port = sensorData.getPort();

        return TemperatureSensor
            .make(factory.getTemperatureSensorMode(mode), factory.getSensorPort(port), helper.extractBlockProperties(block), helper.extractComment(block));

    }
}
