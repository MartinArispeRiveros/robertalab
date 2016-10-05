package de.fhg.iais.roberta.ast;

import org.junit.Assert;
import org.junit.Test;

import de.fhg.iais.roberta.blockly.generated.BlockSet;
import de.fhg.iais.roberta.factory.ArduFactory;
import de.fhg.iais.roberta.jaxb.JaxbHelper;
import de.fhg.iais.roberta.transformer.Jaxb2BlocklyProgramTransformer;

public class ExceptionTest {

    @Test
    public void valueException() throws Exception {
        BlockSet project = JaxbHelper.path2BlockSet("/ast/exceptions/value_exception.xml");
        ArduFactory factory = new ArduFactory(null);
        Jaxb2BlocklyProgramTransformer<?> transformer = new Jaxb2BlocklyProgramTransformer<>(factory);
        try {
            transformer.transform(project);
            Assert.fail();
        } catch ( Exception e ) {
            Assert.assertEquals("Values size is not less or equal to 2!", e.getMessage());
        }
    }

}
