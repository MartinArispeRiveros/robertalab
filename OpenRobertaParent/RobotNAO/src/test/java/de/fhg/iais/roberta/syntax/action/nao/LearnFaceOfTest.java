package de.fhg.iais.roberta.syntax.action.nao;

import org.junit.Assert;
import org.junit.Test;

import de.fhg.iais.roberta.util.RobertaProperties;
import de.fhg.iais.roberta.util.Util1;
import de.fhg.iais.roberta.util.test.nao.HelperNaoForTest;

public class LearnFaceOfTest {
    HelperNaoForTest h = new HelperNaoForTest(new RobertaProperties(Util1.loadProperties(null)));

    @Test
    public void make_ByDefault_ReturnInstanceOfLearnFaceClass() throws Exception {
        String expectedResult = "BlockAST [project=[[Location [x=63, y=63], " + "MainTask []], " + "[Location [x=87, y=113], " + "LearnFace [StringConst [roberta]]]]]";
        
        String result = this.h.generateTransformerString("/action/learnFace.xml");

        Assert.assertEquals(expectedResult, result);
    }
    
    @Test
    public void astToBlock_XMLtoJAXBtoASTtoXML_ReturnsSameXML() throws Exception {

        this.h.assertTransformationIsOk("/action/learnFace.xml");
    }
}