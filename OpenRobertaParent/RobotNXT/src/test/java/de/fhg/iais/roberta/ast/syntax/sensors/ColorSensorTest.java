package de.fhg.iais.roberta.ast.syntax.sensors;

import org.junit.Assert;
import org.junit.Test;

import de.fhg.iais.roberta.util.test.nxt.Helper;

public class ColorSensorTest {
    Helper h = new Helper();

    @Test
    public void setColor() throws Exception {
        //        final String a = "\nSensorColor(S3,\"COLOR\")SensorColor(S1,\"LIGHT\")SensorColor(S4,\"AMBIENTLIGHT\")";
        //        h.assertCodeIsOk(a, "/ast/sensors/sensor_setColor.xml");
        //    }
        String a =
            "BlockAST [project=[[Location [x=-15, y=107], ColorSensor [S3, COLOUR, NO_SLOT]], [Location [x=-13, y=147], ColorSensor [S1, RED, NO_SLOT]],"
                + " [Location [x=-11, y=224], ColorSensor [S4, AMBIENTLIGHT, NO_SLOT]]]]";

        Assert.assertEquals(a, this.h.generateTransformerString("/ast/sensors/sensor_setColor.xml"));
    }
}
