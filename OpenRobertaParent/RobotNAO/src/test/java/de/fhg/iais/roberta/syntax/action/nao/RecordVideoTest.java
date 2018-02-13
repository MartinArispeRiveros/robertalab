package de.fhg.iais.roberta.syntax.action.nao;

import org.junit.Assert;
import org.junit.Test;

import de.fhg.iais.roberta.util.test.nao.HelperNaoForXmlTest;

public class RecordVideoTest {
    private final HelperNaoForXmlTest h = new HelperNaoForXmlTest();

    @Test
    public void make_ByDefault_ReturnInstanceOfRecordVideoClass() throws Exception {
        String expectedResult =
            "BlockAST [project=[[Location [x=63, y=63], " + "MainTask [], " + "RecordVideo [LOW, TOP, NumConst [5], StringConst [RobertaVideo]]]]]";

        String result = this.h.generateTransformerString("/action/recordVideo.xml");

        Assert.assertEquals(expectedResult, result);
    }

    /*
    @Test
    public void astToBlock_XMLtoJAXBtoASTtoXML_ReturnsSameXML() throws Exception {
    
        this.h.assertTransformationIsOk("/action/recordVideo.xml");
    }*/
}