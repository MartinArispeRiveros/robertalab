package de.fhg.iais.roberta.syntax.sensor;

import org.junit.Assert;
import org.junit.Test;

import de.fhg.iais.roberta.util.test.mbed.Helper;

public class PinGetValueSensorTest {
    Helper h = new Helper();

    @Test
    public void make_ByDefault_ReturnInstanceOfPinValueSensorClass() throws Exception {
        String expectedResult =
            "BlockAST [project=[[Location [x=213, y=113], "
                + "MainTask [], "
                + "DisplayTextAction [TEXT, SensorExpr [PinGetValueSensor [S1, ANALOG, NO_SLOT]]], DisplayTextAction [TEXT, SensorExpr [PinGetValueSensor [S0, DIGITAL, NO_SLOT]]]]]]";

        String result = this.h.generateTransformerString("/sensor/read_value_from_pin.xml");

        Assert.assertEquals(expectedResult, result);
    }

    @Test
    public void astToBlock_XMLtoJAXBtoASTtoXML_ReturnsSameXML() throws Exception {
        this.h.assertTransformationIsOk("/sensor/read_value_from_pin.xml");
    }

}
